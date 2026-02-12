import { useState, useMemo } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useStoreProducts, StoreProduct } from '@/hooks/useStoreProducts';
import { OrderDialog } from '@/components/store/OrderDialog';
import { ShoppingBag, Search, ShoppingCart, BookOpen, Loader2 } from 'lucide-react';
import { allCategories } from '@/hooks/useCategories';
import { useLanguage } from '@/contexts/LanguageContext';

const Store = () => {
  const { data: products, isLoading } = useStoreProducts();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<StoreProduct | null>(null);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter(product => {
      const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.author?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !selectedCategory || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const openOrderDialog = (product: StoreProduct) => {
    setSelectedProduct(product);
    setIsOrderDialogOpen(true);
  };

  const getCategoryName = (categoryKey: string) => {
    const key = `category_${categoryKey}`;
    const translated = t(key);
    if (translated !== key) return translated;
    const cat = allCategories.find(c => c.name === categoryKey);
    return cat ? `${cat.icon} ${cat.nameAr}` : categoryKey;
  };

  return (
    <Layout>
      <div className="section-padding">
        <div className="container-library">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl gold-gradient mb-6">
              <ShoppingBag className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {t('bookStore')}
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              {t('bookStoreDesc')}
            </p>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder={t('searchForBook')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(null)}
              >
                {t('all')}
              </Button>
              {allCategories.slice(0, 5).map(cat => (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.name ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(cat.name)}
                >
                  {cat.icon} {getCategoryName(cat.name)}
                </Button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
                  <div className="relative aspect-[3/4] bg-muted">
                    {product.cover_url ? (
                      <img
                        src={product.cover_url}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <BookOpen className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground">
                      {product.price} MRU
                    </Badge>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-sm line-clamp-2 mb-1">
                      {product.title}
                    </h3>
                    {product.author && (
                      <p className="text-xs text-muted-foreground mb-2">
                        {product.author}
                      </p>
                    )}
                    <Badge variant="secondary" className="text-xs mb-3">
                      {getCategoryName(product.category)}
                    </Badge>
                    <Button
                      variant="gold"
                      size="sm"
                      className="w-full gap-2"
                      onClick={() => openOrderDialog(product)}
                    >
                      <ShoppingCart className="h-4 w-4" />
                      {t('orderNow')}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">{t('noProducts')}</h2>
              <p className="text-muted-foreground">
                {searchQuery ? t('noSearchResults') : t('noProductsYet')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Order Dialog */}
      <OrderDialog
        open={isOrderDialogOpen}
        onOpenChange={setIsOrderDialogOpen}
        product={selectedProduct}
      />
    </Layout>
  );
};

export default Store;
