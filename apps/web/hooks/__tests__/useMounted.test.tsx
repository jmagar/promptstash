import { renderHook } from '@testing-library/react';
import useMounted from '../useMounted';

describe('useMounted', () => {
  it('should return false initially', () => {
    const { result } = renderHook(() => useMounted());
    // On first render, before useEffect runs, it should be false
    expect(result.current).toBe(false);
  });

  it('should return true after component mounts', async () => {
    const { result, rerender } = renderHook(() => useMounted());

    // Wait for useEffect to run
    rerender();

    expect(result.current).toBe(true);
  });

  it('should handle multiple rerenders correctly', () => {
    const { result, rerender } = renderHook(() => useMounted());

    rerender();
    expect(result.current).toBe(true);

    rerender();
    expect(result.current).toBe(true);
  });
});
