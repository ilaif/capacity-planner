import {
  Feature,
  TimelineItem,
  Teams,
  TeamAvailability,
  ResourceNeeds,
} from '@/types/resource-planner';
import { logger } from '@/services/loggerService';

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

  // Initialize team availability with varying team sizes
  Object.entries(teams).forEach(([team, sizes]) => {
    teamAvailability[team] = Array.isArray(sizes) ? [...sizes] : Array(52).fill(sizes);
    logger.debug(`Initialized availability for team ${team}`, {
      isVariable: Array.isArray(sizes),
      baseSize: Array.isArray(sizes) ? sizes[0] : sizes,
    });
  });

  features.forEach(feature => {
    logger.debug(`Processing feature: ${feature.name}`, feature);
    const featureAllocation: TimelineItem = {
      feature: feature.name,
      startWeek: 0,
      assignments: {},
    };

    let startWeek = 0;
    let canSchedule = false;

    while (!canSchedule && startWeek < 52) {
      canSchedule = true;
      const resourceNeeds: ResourceNeeds = {};

      Object.entries(feature.requirements).forEach(([team, requirement]) => {
        const { weeks, parallel } = requirement;
        const weeksNeeded = Math.ceil((weeks * overheadFactor) / parallel);
        resourceNeeds[team] = { weeks: weeksNeeded, parallel };

        // Check if we have enough resources for each week of the feature
        for (let w = 0; w < weeksNeeded; w++) {
          const weekIndex = startWeek + w;
          if (weekIndex >= 52 || teamAvailability[team][weekIndex] < parallel) {
            logger.debug(`Cannot schedule ${feature.name} at week ${startWeek}`, {
              team,
              weekIndex,
              required: parallel,
              available: weekIndex < 52 ? teamAvailability[team][weekIndex] : 0,
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
          }
        });

        featureAllocation.startWeek = startWeek;
        featureAllocation.endWeek =
          startWeek + startWeek + Object.keys(resourceNeeds).length > 0
            ? Math.max(...Object.values(resourceNeeds).map(n => n.weeks))
            : 0;
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

    if (startWeek >= 52) {
      logger.warn(`Could not schedule feature ${feature.name} within 52 weeks`, {
        requirements: feature.requirements,
      });
    }
  });

  logger.info('Timeline calculation completed', {
    scheduledFeatures: newTimeline.length,
    totalDuration: Math.max(...newTimeline.map(t => t.endWeek || 0)),
  });
  return newTimeline;
}

export function exportTimelineAsPng(timeline: TimelineItem[], overheadFactor: number): void {
  logger.info('Starting timeline export to PNG', {
    timelineLength: timeline.length,
    overheadFactor,
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

  const width = Math.max(...timeline.map(t => t.endWeek || 0)) * 100 + 100;
  const height = timeline.length * 80 + 50;

  canvas.width = width;
  canvas.height = height;

  logger.debug('Canvas initialized', { width, height });

  // Draw background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  try {
    // Draw grid and week numbers
    drawTimelineGrid(ctx, timeline, width, height);

    // Draw features
    drawTimelineFeatures(ctx, timeline, overheadFactor);

    // Trigger download
    downloadCanvas(canvas);
    logger.info('Timeline exported successfully');
  } catch (error) {
    logger.error('Failed to draw timeline', error as Error);
  }
}

function drawTimelineGrid(
  ctx: CanvasRenderingContext2D,
  timeline: TimelineItem[],
  width: number,
  height: number
): void {
  ctx.strokeStyle = '#e5e7eb';
  ctx.fillStyle = '#6b7280';
  ctx.font = '10px sans-serif';

  for (let w = 0; w <= Math.max(...timeline.map(t => t.endWeek || 0)); w++) {
    ctx.beginPath();
    ctx.moveTo(w * 100, 0);
    ctx.lineTo(w * 100, height);
    ctx.stroke();
    ctx.fillText(`Week ${w}`, w * 100 + 5, 15);
  }
}

function drawTimelineFeatures(
  ctx: CanvasRenderingContext2D,
  timeline: TimelineItem[],
  overheadFactor: number
): void {
  timeline.forEach((allocation, index) => {
    ctx.fillStyle = '#dbeafe';
    ctx.fillRect(
      allocation.startWeek * 100,
      index * 80 + 20,
      (allocation.endWeek || 0 - allocation.startWeek) * 100,
      50
    );

    ctx.fillStyle = '#000000';
    ctx.font = '12px sans-serif';
    ctx.fillText(allocation.feature, allocation.startWeek * 100 + 5, index * 80 + 35);

    Object.entries(allocation.assignments).forEach(([team, requirement], teamIndex) => {
      ctx.font = '10px sans-serif';
      ctx.fillText(
        `${team}: ${Math.round(requirement.weeks * overheadFactor)} (${
          requirement.parallel
        } parallel)`,
        allocation.startWeek * 100 + 5,
        index * 80 + 50 + teamIndex * 12
      );
    });
  });
}

function downloadCanvas(canvas: HTMLCanvasElement): void {
  const link = document.createElement('a');
  link.download = 'timeline.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}
