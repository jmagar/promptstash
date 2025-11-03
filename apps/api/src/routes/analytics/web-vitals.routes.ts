import { logger } from '@workspace/observability';
import { Request, Response, Router } from 'express';

const router = Router();

interface WebVitalMetric {
  name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB' | 'INP';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
}

/**
 * POST /api/analytics/web-vitals
 * Receives and logs Web Vitals metrics from the frontend
 */
router.post('/web-vitals', (req: Request, res: Response) => {
  try {
    const metric = req.body as WebVitalMetric;

    // Validate metric
    if (!metric.name || typeof metric.value !== 'number') {
      return res.status(400).json({ error: 'Invalid metric data' });
    }

    // Log the web vital metric
    logger.info(
      {
        type: 'web_vitals',
        metric: metric.name,
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
        navigationType: metric.navigationType,
        userId: req.user?.id,
        requestId: req.requestId,
      },
      `Web Vital: ${metric.name} = ${metric.value} (${metric.rating})`,
    );

    // Here you could also:
    // - Store metrics in database for historical analysis
    // - Send to external analytics service (Google Analytics, Datadog, etc.)
    // - Trigger alerts for poor ratings
    // - Aggregate metrics for dashboards

    res.status(200).json({ success: true });
  } catch (error) {
    logger.error({ err: error }, 'Failed to process web vitals metric');
    res.status(500).json({ error: 'Failed to process metric' });
  }
});

export default router;
