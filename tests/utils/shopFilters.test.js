import { describe, expect, it } from 'vitest';
import { selectedCategorySlugs, shopCategoryUrl, findShopCategory } from '../../src/utils/shopFilters';
describe('Canonical shop category URLs', () => {
  it('uses the proven public listing query format', () => expect(shopCategoryUrl('living-room')).toBe('/shop?categories=living-room'));
  it('encodes delimiter characters as one category', () => expect(new URL(shopCategoryUrl('sofas&sort=price'), 'http://localhost').searchParams.get('categories')).toBe('sofas&sort=price'));
  it('legacy redirect replaces conflicting categories and preserves search, sort and hash', () => {
    const url=new URL(shopCategoryUrl('living-room','?categories=bedroom&categories=decor&search=sofa&sort=price_low','#items'),'http://localhost');
    expect(url.searchParams.getAll('categories')).toEqual(['living-room']);
    expect(url.searchParams.get('search')).toBe('sofa');expect(url.searchParams.get('sort')).toBe('price_low');expect(url.hash).toBe('#items');
  });
  it('normalizes repeated and comma-separated query filters', () => expect(selectedCategorySlugs(new URLSearchParams('categories=living-room,bedroom&categories=living-room'))).toEqual(['living-room','bedroom']));
  it('finds nested category metadata without a category-detail endpoint', () => {
    const found=findShopCategory([{name:'Living Room',slug:'living-room',subcategories:[{name:'Sofas',slug:'sofas'}]}],'sofas');
    expect(found.name).toBe('Sofas');expect(found.parent.slug).toBe('living-room');
  });
});
