import {
  Feature,
  Teams,
  TimelineItem,
  TeamAvailability,
  ResourceNeeds,
} from '@/types/capacity-planner';
import { logger } from '@/services/loggerService';
import { format, addWeeks } from 'date-fns';

export function calculateTimeline(
  features: Feature[],
  teams: Teams,
  overheadFactor: number
): TimelineItem[] {
  logger.info('Starting timeline calculation', {
    featureCount: features.length,
    teamCount: Object.keys(teams).length,
    overheadFactor,
  });

  const newTimeline: TimelineItem[] = [];
  const teamAvailability: TeamAvailability = {};
  const teamWipCount: { [team: string]: number[] } = {};
  const maxWeek = 104; // Large enough number to handle multi-year planning

  // Initialize team availability and WIP counters with varying team sizes
  Object.entries(teams).forEach(([team, config]) => {
    const sizes = config.sizes;
    teamAvailability[team] = Array(maxWeek).fill(0);
    for (let week = 0; week < maxWeek; week++) {
      for (const size of sizes) {
        if (size.week <= week) {
          teamAvailability[team][week] = size.size;
        }
      }
    }

    teamWipCount[team] = Array(maxWeek).fill(0);
    logger.debug(`Initialized availability for team ${team}`, {
      baseSize: config.sizes[0],
      teamLoad: config.teamLoad,
    });
  });

  features.forEach(feature => {
    logger.debug(`Processing feature: ${feature.name}`, {
      id: feature.id,
      name: feature.name,
      requirements: feature.requirements,
    });
    const featureAllocation: TimelineItem = {
      feature: feature.name,
      startWeek: 0,
      endWeek: 0,
      assignments: {},
    };

    let startWeek = 0;
    let canSchedule = false;

    while (!canSchedule && startWeek < maxWeek) {
      canSchedule = true;
      const resourceNeeds: ResourceNeeds = {};

      Object.entries(feature.requirements).forEach(([team, requirement]) => {
        const { weeks, parallel } = requirement;
        const weeksNeeded = Math.ceil((weeks * overheadFactor) / parallel);
        resourceNeeds[team] = { weeks: weeksNeeded, parallel };

        // Check if we have enough resources and WIP capacity for each week of the feature
        for (let w = 0; w < weeksNeeded; w++) {
          const weekIndex = startWeek + w;
          const teamLoad = teams[team].teamLoad;
          const teamSize = teams[team].sizes[0].size;
          const wipLimit = Math.max(1, Math.floor(teamSize / teamLoad));
          if (
            weekIndex >= maxWeek ||
            teamAvailability[team][weekIndex] < parallel ||
            teamWipCount[team][weekIndex] >= wipLimit
          ) {
            logger.debug(`Cannot schedule '${feature.name}' at week ${startWeek}`, {
              team,
              weekIndex,
              required: parallel,
              available: weekIndex < maxWeek ? teamAvailability[team][weekIndex] : 0,
              currentWip: weekIndex < maxWeek ? teamWipCount[team][weekIndex] : 0,
              wipLimit,
              teamSize,
              teamLoad,
            });
            canSchedule = false;
            break;
          }
        }
      });

      if (canSchedule) {
        Object.entries(feature.requirements).forEach(([team, requirement]) => {
          const { weeks, parallel } = requirement;
          featureAllocation.assignments[team] = { weeks, parallel };

          const weeksNeeded = resourceNeeds[team].weeks;
          for (let w = 0; w < weeksNeeded; w++) {
            teamAvailability[team][startWeek + w] -= parallel;
            teamWipCount[team][startWeek + w]++;
          }
        });

        featureAllocation.startWeek = startWeek;
        featureAllocation.endWeek =
          startWeek + Math.max(...Object.values(resourceNeeds).map(n => n.weeks), 0);
        newTimeline.push(featureAllocation);
        logger.debug(`Scheduled feature ${feature.name}`, {
          startWeek: featureAllocation.startWeek,
          endWeek: featureAllocation.endWeek,
          assignments: featureAllocation.assignments,
        });
      } else {
        startWeek++;
      }
    }
  });

  logger.info('Timeline calculation completed', {
    scheduledFeatures: newTimeline.length,
    totalDuration: Math.max(...newTimeline.map(t => t.endWeek || 0)),
    newTimeline,
  });
  return newTimeline;
}

export function exportTimelineAsPng(
  timeline: TimelineItem[],
  overheadFactor: number,
  options: {
    startDate: Date;
    columnWidth: number;
  }
): void {
  logger.info('Starting timeline export to PNG', {
    timelineLength: timeline.length,
    overheadFactor,
    options,
  });

  if (timeline.length === 0) {
    logger.warn('Cannot export empty timeline');
    return;
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    logger.error('Failed to get canvas context');
    return;
  }

  const { startDate, columnWidth } = options;
  const maxWeek = Math.max(...timeline.map(t => t.endWeek || 0)) + 1;
  const gridCount = maxWeek;
  const width = gridCount * columnWidth;
  const height = timeline.length * 80 + 50;

  canvas.width = width;
  canvas.height = height;

  logger.debug('Canvas initialized', { width, height });

  // Draw background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  try {
    // Draw grid and labels
    drawTimelineGrid(ctx, gridCount, columnWidth, startDate, height);

    // Draw features
    drawTimelineFeatures(ctx, timeline, overheadFactor, columnWidth);

    // Trigger download
    downloadCanvas(canvas);
    logger.info('Timeline exported successfully');
  } catch (error) {
    logger.error('Failed to draw timeline', error as Error);
  }
}

function drawTimelineGrid(
  ctx: CanvasRenderingContext2D,
  gridCount: number,
  columnWidth: number,
  startDate: Date,
  height: number
): void {
  // Draw background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, gridCount * columnWidth, height);

  // Draw header background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, gridCount * columnWidth, 50);
  ctx.strokeStyle = '#e2e8f0'; // slate-200
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 50);
  ctx.lineTo(gridCount * columnWidth, 50);
  ctx.stroke();

  // Draw quarter markers
  const quarters = Math.ceil(gridCount / 13);
  for (let q = 0; q < quarters; q++) {
    const x = q * columnWidth * 13;
    const weekIndex = q * 13;
    const date = addWeeks(startDate, weekIndex);
    const weekInYear = weekIndex % 52;
    const quarter = Math.floor(weekInYear / 13) + 1;

    // Draw quarter separator
    ctx.strokeStyle = '#e2e8f0'; // slate-200
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();

    // Draw quarter label
    ctx.fillStyle = '#64748b'; // slate-500
    ctx.font = '500 12px sans-serif';
    const quarterLabel = `Q${quarter} ${format(date, 'yyyy')}`;
    ctx.fillText(quarterLabel, x + 5, 20);
  }

  // Draw week markers
  ctx.font = '400 11px sans-serif';
  for (let w = 0; w < gridCount; w++) {
    const x = w * columnWidth;
    const date = addWeeks(startDate, w);
    const weekLabel = columnWidth < 90 ? format(date, 'M/d') : `W${w} (${format(date, 'MMM d')})`;

    // Draw week separator
    ctx.strokeStyle = '#e2e8f0'; // slate-200
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();

    // Draw week label
    ctx.fillStyle = '#64748b'; // slate-500
    ctx.fillText(weekLabel, x + 5, 40);
  }
}

function drawTimelineFeatures(
  ctx: CanvasRenderingContext2D,
  timeline: TimelineItem[],
  overheadFactor: number,
  columnWidth: number
): void {
  timeline.forEach((allocation, index) => {
    const y = index * 80 + 50;
    const x = allocation.startWeek * columnWidth;
    const width = ((allocation.endWeek || 0) - allocation.startWeek) * columnWidth;
    const height = 70;

    // Draw feature background with gradient
    const gradient = ctx.createLinearGradient(x, y, x + width, y);
    gradient.addColorStop(0, 'rgba(241, 245, 249, 0.95)'); // slate-100
    gradient.addColorStop(1, 'rgba(243, 232, 255, 0.95)'); // purple-100

    ctx.fillStyle = gradient;
    ctx.strokeStyle = 'rgba(203, 213, 225, 0.5)'; // slate-300/50
    ctx.lineWidth = 1;

    // Draw rounded rectangle
    const radius = 6;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Draw feature name
    ctx.fillStyle = '#0f172a'; // slate-900
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(allocation.feature, x + 10, y + 25);

    // Draw team assignments
    let assignmentX = x + 10;
    let assignmentY = y + 45;

    Object.entries(allocation.assignments)
      .filter(([_, requirement]) => requirement.weeks > 0)
      .forEach(([team, requirement]) => {
        // Draw team pill background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.strokeStyle = 'rgba(203, 213, 225, 0.5)';

        const pillWidth = 100;
        const pillHeight = 22;
        const pillRadius = 11;

        ctx.beginPath();
        ctx.moveTo(assignmentX + pillRadius, assignmentY);
        ctx.lineTo(assignmentX + pillWidth - pillRadius, assignmentY);
        ctx.quadraticCurveTo(
          assignmentX + pillWidth,
          assignmentY,
          assignmentX + pillWidth,
          assignmentY + pillRadius
        );
        ctx.lineTo(assignmentX + pillWidth, assignmentY + pillHeight - pillRadius);
        ctx.quadraticCurveTo(
          assignmentX + pillWidth,
          assignmentY + pillHeight,
          assignmentX + pillWidth - pillRadius,
          assignmentY + pillHeight
        );
        ctx.lineTo(assignmentX + pillRadius, assignmentY + pillHeight);
        ctx.quadraticCurveTo(
          assignmentX,
          assignmentY + pillHeight,
          assignmentX,
          assignmentY + pillHeight - pillRadius
        );
        ctx.lineTo(assignmentX, assignmentY + pillRadius);
        ctx.quadraticCurveTo(assignmentX, assignmentY, assignmentX + pillRadius, assignmentY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Draw team name and requirements
        ctx.fillStyle = '#475569'; // slate-600
        ctx.font = '12px sans-serif';
        const teamText = `${team}: ${Math.ceil(requirement.weeks * overheadFactor)}w`;
        ctx.fillText(teamText, assignmentX + 8, assignmentY + 15);

        assignmentX += pillWidth + 10;
        if (assignmentX + pillWidth > x + width - 10) {
          assignmentX = x + 10;
          assignmentY += pillHeight + 5;
        }
      });
  });
}

function downloadCanvas(canvas: HTMLCanvasElement): void {
  try {
    const link = document.createElement('a');
    link.download = `timeline-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    logger.info('Timeline PNG downloaded successfully');
  } catch (error) {
    logger.error('Failed to download timeline PNG', error as Error);
  }
}
