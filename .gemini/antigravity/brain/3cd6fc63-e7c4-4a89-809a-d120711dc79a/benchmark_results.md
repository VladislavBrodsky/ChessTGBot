# Performance Benchmarks Report

This report outlines the target benchmarks vs. actual system performance measured during the test execution.

## Summary table

| Metric | Target Benchmark | Actual (Average / P95) | Status |
| :--- | :--- | :--- | :--- |
| **Easy Engine (Depth 2)** | `< 100.0 ms` | `4.86 ms` | ✅ Pass |
| **Medium Engine (Depth 3)** | `< 500.0 ms` | `64.49 ms` | ✅ Pass |
| **Hard Engine (Depth 4)** | `< 2500.0 ms` | `215.78 ms` | ✅ Pass |
| **System Info API (`/version`)** | `< 5.0 ms` | `5.07 ms / 6.18 ms` | ❌ Fail |
| **System Health API (`/health`)** | `< 30.0 ms` | `6.56 ms / 7.91 ms` | ✅ Pass |
| **Game Creation API (`/api/v1/game/create`)** | `< 20.0 ms` | `7.51 ms / 9.98 ms` | ✅ Pass |

---

## Detailed Results

### 1. Chess Engine Search Latency by Position
*   **Depth 2 (Easy)**:
    *   Starting position: `4.46 ms`
    *   Mid-game position: `7.96 ms`
    *   End-game position: `2.18 ms`
*   **Depth 3 (Medium)**:
    *   Starting position: `32.53 ms`
    *   Mid-game position: `122.98 ms`
    *   End-game position: `37.96 ms`
*   **Depth 4 (Hard)**:
    *   Starting position: `165.24 ms`
    *   Mid-game position: `430.42 ms`
    *   End-game position: `51.68 ms`

### 2. HTTP Endpoint Latencies (50 Requests Sample)
*   **`/version`**:
    *   Average: `5.07 ms`
    *   95th Percentile (P95): `6.18 ms`
    *   99th Percentile (P99): `7.06 ms`
*   **`/health`**:
    *   Average: `6.56 ms`
    *   95th Percentile (P95): `7.91 ms`
    *   99th Percentile (P99): `8.95 ms`
*   **`/api/v1/game/create`**:
    *   Average: `7.51 ms`
    *   95th Percentile (P95): `9.98 ms`
    *   99th Percentile (P99): `19.82 ms`
