/**
 * useSequenceList Hook
 * 
 * Manages available sequences list with search and filter functionality.
 * Part of Issue #306 - Release 2: Live Sequence Triggering.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getAvailableSequences, isConductorAvailable } from '../services';
import type { AvailableSequence } from '../types';

/**
 * Hook for managing available sequences list
 * 
 * @returns Object containing sequences, loading state, and filter functions
 */
export function useSequenceList() {
  const [sequences, setSequences] = useState<AvailableSequence[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlugin, setFilterPlugin] = useState<string>('all');
  const [showMountedOnly, setShowMountedOnly] = useState(false);

  /**
   * Loads available sequences from the conductor
   */
  const loadSequences = useCallback(async () => {
    if (!isConductorAvailable()) {
      setError('Conductor not available');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const availableSequences = await getAvailableSequences();
      setSequences(availableSequences);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sequences');
      console.error('Failed to load sequences:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load sequences on mount
  useEffect(() => {
    loadSequences();
  }, [loadSequences]);

  /**
   * Filtered sequences based on search query, plugin filter, and mounted status
   */
  const filteredSequences = useMemo(() => {
    let filtered = sequences;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(seq =>
        seq.sequenceName.toLowerCase().includes(query) ||
        seq.sequenceId.toLowerCase().includes(query) ||
        seq.pluginId.toLowerCase().includes(query) ||
        seq.description?.toLowerCase().includes(query)
      );
    }

    // Filter by plugin
    if (filterPlugin !== 'all') {
      filtered = filtered.filter(seq => seq.pluginId === filterPlugin);
    }

    // Filter by mounted status
    if (showMountedOnly) {
      filtered = filtered.filter(seq => seq.isMounted);
    }

    return filtered;
  }, [sequences, searchQuery, filterPlugin, showMountedOnly]);

  /**
   * Sequences grouped by plugin
   */
  const groupedSequences = useMemo(() => {
    const groups: Record<string, AvailableSequence[]> = {};

    filteredSequences.forEach(seq => {
      if (!groups[seq.pluginId]) {
        groups[seq.pluginId] = [];
      }
      groups[seq.pluginId].push(seq);
    });

    return groups;
  }, [filteredSequences]);

  /**
   * List of unique plugin IDs for filter dropdown
   */
  const pluginIds = useMemo(() => {
    const ids = new Set(sequences.map(seq => seq.pluginId));
    return Array.from(ids).sort();
  }, [sequences]);

  /**
   * Statistics about sequences
   */
  const stats = useMemo(() => {
    const total = sequences.length;
    const mounted = sequences.filter(seq => seq.isMounted).length;
    const filtered = filteredSequences.length;

    return {
      total,
      mounted,
      unmounted: total - mounted,
      filtered,
      pluginCount: pluginIds.length
    };
  }, [sequences, filteredSequences, pluginIds]);

  return {
    sequences: filteredSequences,
    groupedSequences,
    pluginIds,
    stats,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    filterPlugin,
    setFilterPlugin,
    showMountedOnly,
    setShowMountedOnly,
    refresh: loadSequences
  };
}

