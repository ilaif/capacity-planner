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
  const maxWeeks = 1000; // Large enough number to handle multi-year planning

  // Initialize team availability and WIP counters with varying team sizes
  Object.entries(teams).forEach(([team, config]) => {
    const sizes = Array.isArray(config.size) ? config.size : Array(maxWeeks).fill(config.size);
    teamAvailability[team] = [
      ...sizes,
      ...Array(maxWeeks - sizes.length).fill(sizes[sizes.length - 1]),
    ];
    teamWipCount[team] = Array(maxWeeks).fill(0);
    logger.debug(`Initialized availability for team ${team}`, {
      isVariable: Array.isArray(config.size),
      baseSize: Array.isArray(config.size) ? config.size[0] : config.size,
      wipLimit: config.wipLimit,
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
      assignments: {},
    };

    let startWeek = 0;
    let canSchedule = false;

    while (!canSchedule && startWeek < maxWeeks) {
      canSchedule = true;
      const resourceNeeds: ResourceNeeds = {};

      Object.entries(feature.requirements).forEach(([team, requirement]) => {
        const { weeks, parallel } = requirement;
        const weeksNeeded = Math.ceil((weeks * overheadFactor) / parallel);
        resourceNeeds[team] = { weeks: weeksNeeded, parallel };

        // Check if we have enough resources and WIP capacity for each week of the feature
        for (let w = 0; w < weeksNeeded; w++) {
          const weekIndex = startWeek + w;
          if (
            weekIndex >= maxWeeks ||
            teamAvailability[team][weekIndex] < parallel ||
            teamWipCount[team][weekIndex] >= teams[team].wipLimit
          ) {
            logger.debug(`Cannot schedule ${feature.name} at week ${startWeek}`, {
              team,
              weekIndex,
              required: parallel,
              available: weekIndex < maxWeeks ? teamAvailability[team][weekIndex] : 0,
              currentWip: weekIndex < maxWeeks ? teamWipCount[team][weekIndex] : 0,
              wipLimit: teams[team].wipLimit,
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
        logger.info(`Scheduled feature ${feature.name}`, {
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
    drawTimelineFeatures(ctx, timeline, overheadFactor, columnWidth, startDate);

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
  ctx.strokeStyle = '#e5e7eb';
  ctx.fillStyle = '#6b7280';
  ctx.font = '10px sans-serif';

  // Draw quarter markers
  const quarters = Math.ceil(gridCount / 13);
  for (let q = 0; q < quarters; q++) {
    const x = q * columnWidth * 13;
    const weekIndex = q * 13;
    const date = addWeeks(startDate, weekIndex);
    const year = Math.floor(weekIndex / 52) + 1;
    const weekInYear = weekIndex % 52;
    const quarter = Math.floor(weekInYear / 13) + 1;
    const quarterLabel =
      columnWidth * 13 < 100
        ? `Y${year}Q${quarter}`
        : `Year ${year} Q${quarter} (${format(date, 'MMM yyyy')})`;

    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    if (q > 0) ctx.strokeStyle = '#d1d5db'; // Thicker border for quarters
    ctx.stroke();
    ctx.strokeStyle = '#e5e7eb'; // Reset to normal border

    ctx.font = 'bold 10px sans-serif';
    ctx.fillText(quarterLabel, x + 5, 15);
  }

  // Draw week markers if in weeks mode
  ctx.font = '10px sans-serif';
  for (let w = 0; w < gridCount; w++) {
    const x = w * columnWidth;
    const date = addWeeks(startDate, w);
    const weekLabel = columnWidth < 50 ? format(date, 'M/d') : `W${w} (${format(date, 'MMM d')})`;

    ctx.beginPath();
    ctx.moveTo(x, 24); // Start below quarter markers
    ctx.lineTo(x, height);
    ctx.stroke();

    ctx.fillText(weekLabel, x + 5, 35);
  }
}

function drawTimelineFeatures(
  ctx: CanvasRenderingContext2D,
  timeline: TimelineItem[],
  overheadFactor: number,
  columnWidth: number,
  startDate: Date
): void {
  timeline.forEach((allocation, index) => {
    const x = allocation.startWeek * columnWidth;

    const width = ((allocation.endWeek || 0) - allocation.startWeek) * columnWidth;

    // Draw feature box
    ctx.fillStyle = '#dbeafe';
    ctx.fillRect(x, index * 80 + 40, width, 60);

    // Draw feature text
    ctx.fillStyle = '#000000';
    ctx.font = '12px sans-serif';
    const featureText = allocation.feature;
    ctx.fillText(featureText, x + 5, index * 80 + 55);

    // Draw requirements
    Object.entries(allocation.assignments).forEach(([team, requirement], teamIndex) => {
      ctx.font = '10px sans-serif';
      const reqText = `${team}: ${Math.round(requirement.weeks * overheadFactor)} (${
        requirement.parallel
      } parallel)`;
      ctx.fillText(reqText, x + 5, index * 80 + 70 + teamIndex * 12);
    });

    // Draw dates
    const startDateText = format(addWeeks(startDate, allocation.startWeek), 'MMM d, yyyy');
    const endDateText = format(addWeeks(startDate, allocation.endWeek || 0), 'MMM d, yyyy');
    ctx.font = '10px sans-serif';
    ctx.fillText(`${startDateText} - ${endDateText}`, x + 5, index * 80 + 95);
  });
}

function downloadCanvas(canvas: HTMLCanvasElement): void {
  const link = document.createElement('a');
  link.download = 'timeline.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}
