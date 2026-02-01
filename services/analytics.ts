import { AnalyticsEvent } from "../types";

/**
 * World-class analytics logger for KenyaAI.
 * In a real production environment, this would send data to Mixpanel, Segment, or an internal API.
 */
export const logAnalyticsEvent = (name: string, properties: Record<string, any>) => {
  const event: AnalyticsEvent = {
    name,
    properties: {
      ...properties,
      timestamp: new Date().toISOString(),
      platform: 'KenyaAI-Web-v5',
    }
  };

  // Log to console for development/observability
  console.group(`📊 Analytics Event: ${name}`);
  console.table(event.properties);
  console.groupEnd();

  // Future expansion: fetch('/api/analytics', { method: 'POST', body: JSON.stringify(event) });
};