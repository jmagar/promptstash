import { NextRequest, NextResponse } from 'next/server';

/**
 * Web Vitals Analytics Endpoint
 *
 * Receives Core Web Vitals metrics from the client-side WebVitals component.
 *
 * Metrics tracked:
 * - CLS (Cumulative Layout Shift)
 * - FCP (First Contentful Paint)
 * - LCP (Largest Contentful Paint)
 * - TTFB (Time to First Byte)
 * - INP (Interaction to Next Paint)
 *
 * TODO: Integrate with your analytics service (e.g., send to API server, database, or third-party service)
 */

interface WebVitalMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType?: string;
}

export async function POST(request: NextRequest) {
  try {
    const metric: WebVitalMetric = await request.json();

    // Validate the metric data
    if (!metric.name || typeof metric.value !== 'number') {
      return NextResponse.json({ error: 'Invalid metric data' }, { status: 400 });
    }

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Web Vitals API]', {
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
      });
    }

    // TODO: Send to your analytics service
    // Examples:
    // 1. Send to your Express API:
    //    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/analytics/web-vitals`, {
    //      method: 'POST',
    //      headers: { 'Content-Type': 'application/json' },
    //      body: JSON.stringify(metric),
    //    });
    //
    // 2. Store in database via Prisma:
    //    await prisma.webVital.create({
    //      data: {
    //        name: metric.name,
    //        value: metric.value,
    //        rating: metric.rating,
    //        // ... other fields
    //      },
    //    });
    //
    // 3. Send to third-party service (Google Analytics, Vercel Analytics, etc.):
    //    // Implementation depends on the service

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error processing web vitals:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
