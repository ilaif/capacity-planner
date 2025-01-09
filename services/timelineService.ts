import {
  Feature,
  TimelineItem,
  Teams,
  TeamAvailability,
  ResourceNeeds,
} from '@/types/resource-planner';

export function calculateTimeline(
  features: Feature[],
  teams: Teams,
  overheadFactor: number
): TimelineItem[] {
  const newTimeline: TimelineItem[] = [];
  const teamAvailability: TeamAvailability = {};
  Object.keys(teams).forEach(team => {
    teamAvailability[team] = Array(52).fill(teams[team]);
  });

  features.forEach(feature => {
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

        for (let w = 0; w < weeksNeeded; w++) {
          if (teamAvailability[team][startWeek + w] < parallel) {
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
          startWeek + Math.max(...Object.values(resourceNeeds).map(n => n.weeks));
        newTimeline.push(featureAllocation);
      } else {
        startWeek++;
      }
    }
  });

  return newTimeline;
}

export function exportTimelineAsPng(timeline: TimelineItem[], overheadFactor: number): void {
  if (timeline.length === 0) return;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    console.error('Canvas context not found');
    return;
  }

  const width = Math.max(...timeline.map(t => t.endWeek || 0)) * 100 + 100;
  const height = timeline.length * 80 + 50;

  canvas.width = width;
  canvas.height = height;

  // Draw background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Draw grid and week numbers
  drawTimelineGrid(ctx, timeline, width, height);

  // Draw features
  drawTimelineFeatures(ctx, timeline, overheadFactor);

  // Trigger download
  downloadCanvas(canvas);
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
