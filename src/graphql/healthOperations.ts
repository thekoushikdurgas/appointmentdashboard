/** GraphQL operation strings for the Health module (see `HealthQuery` in generated/types). */

export const HEALTH_GATEWAY_PUBLIC = `query GatewayHealth {
  health {
    apiHealth {
      status
      environment
    }
    apiMetadata {
      name
      version
      docs
    }
  }
}`;

export const HEALTH_VQL = `query GetVQLHealth {
  health {
    vqlHealth {
      connectraEnabled
      connectraStatus
      connectraBaseUrl
      connectraDetails {
        status
        version
        uptime
      }
      connectraError
      monitoringAvailable
    }
    vqlStats {
      message
      note
    }
  }
}`;

export const HEALTH_PERFORMANCE_STATS = `query GetPerformanceStats {
  health {
    performanceStats {
      cache {
        enabled
        useRedis
        hits
        misses
        hitRate
        size
        maxSize
      }
      slowQueries {
        thresholdMs
        countLastHour
      }
      database {
        status
        poolSize
        activeConnections
        idleConnections
      }
      s3 {
        status
        bucket
        region
        message
        error
      }
      endpointPerformance {
        totalRequests
        averageResponseTimeMs
        p95ResponseTimeMs
        p99ResponseTimeMs
        slowEndpoints {
          endpoint
          averageTimeMs
          requestCount
        }
      }
      tokenBlacklistCleanup {
        cleanupIntervalSeconds
        lastError
        lastReason
        lastRemovedCount
        lastRunStatus
      }
    }
  }
}`;
