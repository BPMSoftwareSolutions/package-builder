/**
 * useEventMonitoring Hook
 * 
 * Subscribes to EventRouter topics for real-time logging.
 * Extracted from DiagnosticsPanel.tsx as part of Phase 3 refactoring.
 * 
 * @see docs/refactoring/diagnostics-modularity-strategy.md
 * @see docs/refactoring/phase-3-implementation-guide.md
 */

import { useEffect } from 'react';
import { EventRouter } from "@renderx-plugins/host-sdk";

/**
 * Hook for monitoring EventRouter topics
 * 
 * @param conductor - The conductor instance
 * @param addLog - Callback function to add log entries
 */
export function useEventMonitoring(
  conductor: any,
  addLog: (level: 'info' | 'warn' | 'error', message: string, data?: any) => void
) {
  useEffect(() => {
    if (!conductor) return;

    const subscriptions: Array<() => void> = [];

    // Subscribe to common topics for monitoring
    const topicsToMonitor = [
      'plugin.mounted',
      'plugin.unmounted',
      'sequence.executed',
      'sequence.failed',
      'component.created',
      'component.updated',
      'component.deleted',
      'error.occurred'
    ];

    topicsToMonitor.forEach(topic => {
      try {
        const unsubscribe = EventRouter.subscribe(topic, (data: any) => {
          const level = topic.includes('failed') || topic.includes('error') ? 'error' : 'info';
          addLog(level, `Event: ${topic}`, data);
        });
        subscriptions.push(unsubscribe);
      } catch (error) {
        // Topic might not be registered yet, skip
        console.warn(`Failed to subscribe to topic: ${topic}`, error);
      }
    });

    // Cleanup subscriptions on unmount
    return () => {
      subscriptions.forEach(unsubscribe => {
        try {
          unsubscribe();
        } catch (error) {
          console.warn('Failed to unsubscribe from topic', error);
        }
      });
    };
  }, [conductor, addLog]);
}

