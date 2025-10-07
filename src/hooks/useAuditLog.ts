/**
 * Audit Logging Hook - Track security-critical actions
 */

import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type AuditEventType = 
  | 'user_login'
  | 'user_logout'
  | 'admin_action'
  | 'data_access'
  | 'data_modification'
  | 'ai_generation'
  | 'payment'
  | 'security_event'
  | 'plugin_installation'
  | 'collaboration_start'
  | 'role_change';

interface AuditLogEntry {
  event_type: AuditEventType;
  user_id?: string;
  details: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export const useAuditLog = () => {
  /**
   * Log an audit event
   */
  const logEvent = useCallback(async (entry: AuditLogEntry) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Create audit log entry
      const auditEntry = {
        event_type: entry.event_type,
        user_id: entry.user_id || user?.id,
        event_data: {
          ...entry.details,
          timestamp: new Date().toISOString(),
          severity: entry.severity || 'medium',
        },
        ip_address: entry.ip_address,
        user_agent: entry.user_agent || navigator.userAgent,
      };

      // Store in analytics_events table
      const { error } = await supabase
        .from('analytics_events')
        .insert(auditEntry);

      if (error) {
        console.error('Audit log error:', error);
        // Don't throw - audit logging should not break app functionality
      }

      // For critical events, also log to console
      if (entry.severity === 'critical') {
        console.warn('CRITICAL AUDIT EVENT:', auditEntry);
      }
    } catch (error) {
      console.error('Failed to log audit event:', error);
    }
  }, []);

  /**
   * Log user authentication events
   */
  const logAuth = useCallback(async (action: 'login' | 'logout') => {
    await logEvent({
      event_type: action === 'login' ? 'user_login' : 'user_logout',
      details: { action },
      severity: 'medium',
    });
  }, [logEvent]);

  /**
   * Log admin actions for security monitoring
   */
  const logAdminAction = useCallback(async (action: string, details: Record<string, any>) => {
    await logEvent({
      event_type: 'admin_action',
      details: { action, ...details },
      severity: 'high',
    });
  }, [logEvent]);

  /**
   * Log data access for compliance
   */
  const logDataAccess = useCallback(async (resourceType: string, resourceId: string) => {
    await logEvent({
      event_type: 'data_access',
      details: { resourceType, resourceId },
      severity: 'low',
    });
  }, [logEvent]);

  /**
   * Log security events
   */
  const logSecurityEvent = useCallback(async (event: string, details: Record<string, any>) => {
    await logEvent({
      event_type: 'security_event',
      details: { event, ...details },
      severity: 'critical',
    });
  }, [logEvent]);

  /**
   * Log AI model usage for MLOps tracking
   */
  const logAIGeneration = useCallback(async (modelName: string, success: boolean, details: Record<string, any>) => {
    await logEvent({
      event_type: 'ai_generation',
      details: { modelName, success, ...details },
      severity: 'low',
    });
  }, [logEvent]);

  return {
    logEvent,
    logAuth,
    logAdminAction,
    logDataAccess,
    logSecurityEvent,
    logAIGeneration,
  };
};
