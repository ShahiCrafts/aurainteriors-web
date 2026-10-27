import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
vi.mock('../../../src/api/productApi', () => ({ default: { getById: vi.fn(async () => ({ data: { product: { _id:'665f1c2ab3d4e5f60718293a' } } })) } }));
import productApi from '../../../src/api/productApi';
import { useProduct } from '../../../src/hooks/product/useProductTan';
describe('Product detail uses public cached catalogue identifiers', () => {
  it.each([['list', {}], ['ar-catalog']])('uses exact slug from the %s cache', async (...parts) => {
    const client = new QueryClient({defaultOptions:{queries:{retry:false}}});
    const id='665f1c2ab3d4e5f60718293a';
    client.setQueryData(['products',...parts],{data:{products:[{_id:id,slug:'test-sofa'}]}});
    const wrapper=({children})=><QueryClientProvider client={client}>{children}</QueryClientProvider>;
    const {result,unmount}=renderHook(()=>useProduct('test-sofa'),{wrapper});
    await waitFor(()=>expect(result.current.isSuccess).toBe(true));
    expect(productApi.getById).toHaveBeenLastCalledWith('test-sofa',expect.objectContaining({knownId:id,signal:expect.anything()}));
    unmount();client.clear();
  });
});
