#!/bin/bash
# Compare performance results before and after migration
#
# Usage:
#   ./scripts/compare-performance.sh baseline-results.json post-migration-results.json

set -e

if [ $# -ne 2 ]; then
  echo "Usage: $0 <baseline-file> <post-migration-file>"
  echo "Example: $0 baseline-results.json post-migration-results.json"
  exit 1
fi

BASELINE=$1
POST_MIGRATION=$2

if [ ! -f "$BASELINE" ]; then
  echo "Error: Baseline file not found: $BASELINE"
  exit 1
fi

if [ ! -f "$POST_MIGRATION" ]; then
  echo "Error: Post-migration file not found: $POST_MIGRATION"
  exit 1
fi

echo "=== PERFORMANCE COMPARISON ==="
echo ""
echo "Baseline:        $BASELINE"
echo "Post-Migration:  $POST_MIGRATION"
echo ""

# Extract timestamps
BASELINE_TIME=$(jq -r '.timestamp' "$BASELINE")
POST_TIME=$(jq -r '.timestamp' "$POST_MIGRATION")

echo "Baseline Time:        $BASELINE_TIME"
echo "Post-Migration Time:  $POST_TIME"
echo ""

# Compare summary
BASELINE_TOTAL=$(jq -r '.summary.total' "$BASELINE")
POST_TOTAL=$(jq -r '.summary.total' "$POST_MIGRATION")
BASELINE_AVG=$(jq -r '.summary.average' "$BASELINE")
POST_AVG=$(jq -r '.summary.average' "$POST_MIGRATION")

echo "=== SUMMARY ==="
printf "%-25s %10s %10s %10s\n" "Metric" "Before" "After" "Change"
printf "%-25s %10s %10s %10s\n" "-------------------------" "----------" "----------" "----------"
printf "%-25s %10.2f %10.2f %10.2f%%\n" "Total Time (ms)" "$BASELINE_TOTAL" "$POST_TOTAL" "$(echo "scale=2; (($POST_TOTAL - $BASELINE_TOTAL) / $BASELINE_TOTAL) * 100" | bc)"
printf "%-25s %10.2f %10.2f %10.2f%%\n" "Average Time (ms)" "$BASELINE_AVG" "$POST_AVG" "$(echo "scale=2; (($POST_AVG - $BASELINE_AVG) / $BASELINE_AVG) * 100" | bc)"
echo ""

# Compare individual tests
echo "=== INDIVIDUAL TEST RESULTS ==="
printf "%-35s %10s %10s %10s %10s\n" "Test Name" "Before" "After" "Diff" "Change %"
printf "%-35s %10s %10s %10s %10s\n" "-----------------------------------" "----------" "----------" "----------" "----------"

# Get number of tests
NUM_TESTS=$(jq '.tests | length' "$BASELINE")

for ((i=0; i<NUM_TESTS; i++)); do
  TEST_NAME=$(jq -r ".tests[$i].name" "$BASELINE")
  BASELINE_TIME=$(jq -r ".tests[$i].time" "$BASELINE")
  POST_TIME=$(jq -r ".tests[$i].time" "$POST_MIGRATION")

  # Calculate difference and percentage
  DIFF=$(echo "scale=2; $POST_TIME - $BASELINE_TIME" | bc)
  CHANGE_PCT=$(echo "scale=2; (($POST_TIME - $BASELINE_TIME) / $BASELINE_TIME) * 100" | bc)

  printf "%-35s %10.2f %10.2f %10.2f %10.2f%%\n" "$TEST_NAME" "$BASELINE_TIME" "$POST_TIME" "$DIFF" "$CHANGE_PCT"
done

echo ""
echo "=== INTERPRETATION ==="
echo "Negative percentages indicate performance improvement (faster queries)"
echo "Positive percentages indicate performance regression (slower queries)"
echo ""

# Calculate overall improvement
OVERALL_IMPROVEMENT=$(echo "scale=2; (($BASELINE_TOTAL - $POST_TOTAL) / $BASELINE_TOTAL) * 100" | bc)
echo "Overall Performance Improvement: $OVERALL_IMPROVEMENT%"
echo ""

# Determine if indexes helped
if (( $(echo "$OVERALL_IMPROVEMENT > 0" | bc -l) )); then
  echo "✅ SUCCESS: Queries are faster after adding indexes!"
elif (( $(echo "$OVERALL_IMPROVEMENT < -5" | bc -l) )); then
  echo "⚠️  WARNING: Queries are >5% slower after adding indexes. Investigate!"
else
  echo "ℹ️  INFO: Performance change is negligible (<5%)"
fi
echo ""
