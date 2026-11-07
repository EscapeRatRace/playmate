import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Image, Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCategories, useProduct, useProductVariants, useProducts } from '@features/products/hooks/useProducts';
import ProductCard from '@features/products/components/ProductCard';
import { apiClient } from '@shared/services/api';
import paymentService from '@shared/services/payments';
import { useCartStore } from '@store/cart.store';
import { useAuthStore } from '@store/auth.store';
import { useTheme } from '@theme/index';
import { Button, Card, EmptyState, ErrorState, LoadingState } from '@components/ui';
import type { Category, Product, ProductVariant } from '@playmate/types';

type Envelope<T> = { success?: boolean; data: T; message?: string | string[] };
type ListedProduct = Product & { minPrice?: number | null; maxPrice?: number | null };
type OrderSummary = { id: string; status: string; totalAmount: number; paymentId?: string | null; createdAt?: string };
const money = (amount: number) => `₹${Math.round(amount).toLocaleString('en-IN')}`;

export function ShopHomeScreen() {
  const { colors, spacing, typography } = useTheme();
  const navigation = useNavigation<any>();
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const categories = useCategories();
  const products = useProducts({ search: search.trim() || undefined, categoryId });
  const cartCount = useCartStore((state) => state.getItemCount());
  const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: colors.background.screen }, content: { padding: spacing.md, paddingBottom: spacing.xxl }, header: { gap: spacing.md, marginBottom: spacing.md }, titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, title: { ...typography.h3, color: colors.text.primary }, subtitle: { ...typography.body2, color: colors.text.secondary }, search: { minHeight: 48, borderWidth: 1, borderColor: colors.border.medium, borderRadius: 14, paddingHorizontal: spacing.md, backgroundColor: colors.background.primary, color: colors.text.primary, ...typography.body1 }, categories: { flexDirection: 'row', gap: spacing.sm }, category: { borderWidth: 1, borderColor: colors.border.medium, borderRadius: 99, backgroundColor: colors.background.primary, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }, categoryActive: { borderColor: colors.primary[600], backgroundColor: colors.primary[600] }, categoryText: { ...typography.caption, color: colors.text.secondary }, categoryTextActive: { color: colors.text.inverse }, card: { flex: 1, minHeight: 300, margin: spacing.xs }, price: { ...typography.subtitle2, color: colors.text.primary, marginHorizontal: spacing.sm }, action: { margin: spacing.sm, marginTop: spacing.xs } });
  const data = products.data?.items ?? [];
  const listHeader = <View style={styles.header}>
    <View style={styles.titleRow}><View><Text style={styles.title}>Sports shop</Text><Text style={styles.subtitle}>Gear for your next game</Text></View><Button title={`Cart${cartCount ? ` · ${cartCount}` : ''}`} size="sm" variant="outline" onPress={() => navigation.navigate('Cart')} /></View>
    <TextInput style={styles.search} value={search} onChangeText={setSearch} placeholder="Search equipment, shoes, apparel" placeholderTextColor={colors.text.tertiary} returnKeyType="search" />
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
      <Pressable onPress={() => setCategoryId(undefined)} style={[styles.category, !categoryId && styles.categoryActive]}><Text style={[styles.categoryText, !categoryId && styles.categoryTextActive]}>All</Text></Pressable>
      {(categories.data ?? []).map((category: Category) => <Pressable key={category.id} onPress={() => setCategoryId(category.id)} style={[styles.category, categoryId === category.id && styles.categoryActive]}><Text style={[styles.categoryText, categoryId === category.id && styles.categoryTextActive]}>{category.name}</Text></Pressable>)}
    </ScrollView>
  </View>;
  if (products.isLoading || categories.isLoading) return <LoadingState label="Loading sports gear…" />;
  if (products.isError) return <ErrorState title="Shop is unavailable" description="Check your connection and try again." action={<Button title="Retry" variant="outline" onPress={() => void products.refetch()} />} />;
  return <FlatList style={styles.page} contentContainerStyle={styles.content} data={data as ListedProduct[]} keyExtractor={(item) => item.id} numColumns={2} ListHeaderComponent={listHeader} refreshControl={<RefreshControl refreshing={products.isRefetching} onRefresh={() => void products.refetch()} />} ListEmptyComponent={<EmptyState title="No products found" description={search ? 'Try a different search.' : 'Sports gear will appear here as the catalog is stocked.'} />} renderItem={({ item }) => <View style={styles.card}><ProductCard product={item} onPress={() => navigation.navigate('ProductDetail', { productId: item.id })} />{item.minPrice != null ? <Text style={styles.price}>{item.maxPrice && item.maxPrice !== item.minPrice ? `${money(item.minPrice)} – ${money(item.maxPrice)}` : money(item.minPrice)}</Text> : <Text style={styles.price}>See options</Text>}<Button title="View options" size="sm" variant="outline" style={styles.action} onPress={() => navigation.navigate('ProductDetail', { productId: item.id })} /></View>} />;
}

export function ProductDetailScreen() {
  const { colors, spacing, typography, radius } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const productId = route.params?.productId as string | undefined;
  const product = useProduct(productId ?? '');
  const variants = useProductVariants(productId ?? '');
  const addItem = useCartStore((state) => state.addItem);
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [added, setAdded] = useState(false);
  useEffect(() => { if (variants.data?.length && !selectedId) setSelectedId(variants.data[0].id); }, [variants.data, selectedId]);
  const selected = variants.data?.find((variant) => variant.id === selectedId);
  const add = useMutation({ mutationFn: () => { if (!selected) throw new Error('Choose a size or option first.'); return addItem(selected.id, 1); }, onSuccess: () => { setAdded(true); Alert.alert('Added to cart', 'This item is in your sports shop cart.'); }, onError: (error: any) => Alert.alert('Could not add item', error?.message ?? 'Please try again.') });
  const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: colors.background.screen }, content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl }, image: { width: '100%', height: 300, borderRadius: radius.lg, backgroundColor: colors.background.secondary }, title: { ...typography.h3, color: colors.text.primary }, body: { ...typography.body2, color: colors.text.secondary, lineHeight: 22 }, price: { ...typography.h4, color: colors.primary[700] }, label: { ...typography.subtitle2, color: colors.text.primary }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }, chip: { borderWidth: 1, borderColor: colors.border.medium, borderRadius: 99, backgroundColor: colors.background.primary, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }, chipActive: { borderColor: colors.primary[600], backgroundColor: colors.primary[600] }, chipText: { ...typography.caption, color: colors.text.secondary }, chipTextActive: { color: colors.text.inverse }, bottom: { flexDirection: 'row', gap: spacing.sm } });
  if (product.isLoading || variants.isLoading) return <LoadingState label="Loading product…" />;
  if (product.isError || !product.data) return <ErrorState title="Product unavailable" description="This item may have been removed. Return to the shop and choose another product." action={<Button title="Back to shop" variant="outline" onPress={() => navigation.goBack()} />} />;
  const item = product.data;
  return <ScrollView style={styles.page} contentContainerStyle={styles.content}>
    {item.images?.[0] ? <Image source={{ uri: item.images[0] }} style={styles.image} resizeMode="cover" /> : <View style={[styles.image, { alignItems: 'center', justifyContent: 'center' }]}><Text style={styles.title}>{item.name.slice(0, 1)}</Text></View>}
    {item.brand ? <Text style={styles.body}>{item.brand}</Text> : null}<Text style={styles.title}>{item.name}</Text>
    {selected ? <Text style={styles.price}>{money(selected.price)}</Text> : <Text style={styles.body}>Select an available option</Text>}
    {item.averageRating ? <Text style={styles.body}>★ {item.averageRating.toFixed(1)} · {item.reviewCount} reviews</Text> : null}
    <Text style={styles.body}>{item.description}</Text>
    <Text style={styles.label}>Choose size / variant</Text>
    {variants.isError ? <Text style={styles.body}>Product options could not be loaded. Try again.</Text> : <View style={styles.chips}>{(variants.data ?? []).map((variant: ProductVariant) => { const label = [variant.size, variant.color].filter(Boolean).join(' · ') || variant.sku; const active = selectedId === variant.id; return <Pressable key={variant.id} accessibilityRole="button" accessibilityState={{ selected: active }} onPress={() => { setSelectedId(variant.id); setAdded(false); }} style={[styles.chip, active && styles.chipActive]}><Text style={[styles.chipText, active && styles.chipTextActive]}>{label} · {money(variant.price)}</Text></Pressable>; })}</View>}
    <View style={styles.bottom}><View style={{ flex: 1 }}><Button title={add.isPending ? 'Adding…' : added ? 'Add another' : 'Add to cart'} onPress={() => add.mutate()} loading={add.isPending} disabled={!selected || add.isPending} /></View><Button title="Cart" variant="outline" onPress={() => navigation.navigate('Cart')} /></View>
  </ScrollView>;
}

export function CartScreen() {
  const { colors, spacing, typography } = useTheme();
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const cart = useCartStore((state) => state);
  useEffect(() => { void cart.fetchCart().catch(() => undefined); }, []);
  const subtotal = cart.getSubtotal();
  const tax = Math.round(subtotal * 0.18);
  const shipping = subtotal >= 999 || subtotal === 0 ? 0 : 49;
  const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: colors.background.screen }, content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl }, title: { ...typography.h3, color: colors.text.primary }, name: { ...typography.subtitle2, color: colors.text.primary }, body: { ...typography.body2, color: colors.text.secondary }, row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm }, summary: { borderTopWidth: 1, borderColor: colors.border.light, paddingTop: spacing.md, gap: spacing.sm } });
  const refresh = () => { void cart.fetchCart().catch(() => undefined); void queryClient.invalidateQueries({ queryKey: ['cart'] }); };
  const update = async (itemId: string, quantity: number) => { try { if (quantity <= 0) await cart.removeItem(itemId); else await cart.updateItem(itemId, quantity); } catch (error: any) { Alert.alert('Could not update cart', error?.message ?? 'Please try again.'); } };
  if (cart.isLoading && !cart.items.length) return <LoadingState label="Loading your cart…" />;
  if (!cart.items.length) return <EmptyState title="Your cart is empty" description="Find sports gear for your next game." action={<Button title="Browse the shop" onPress={() => navigation.navigate('ShopHome')} />} />;
  return <FlatList style={styles.page} contentContainerStyle={styles.content} data={cart.items} keyExtractor={(item) => item.id} refreshControl={<RefreshControl refreshing={cart.isLoading} onRefresh={refresh} />} ListHeaderComponent={<Text style={styles.title}>Your cart · {cart.getItemCount()} items</Text>} renderItem={({ item }) => { const variant = cart.variants[item.variantId]; return <Card padding="md"><Text style={styles.name}>{variant?.sku ?? 'Sports item'}</Text><Text style={styles.body}>{[variant?.size, variant?.color].filter(Boolean).join(' · ') || 'Standard option'}</Text><View style={styles.row}><Text style={styles.body}>{money(variant?.price ?? 0)} each</Text><View style={styles.row}><Button title="−" size="sm" variant="outline" onPress={() => void update(item.id, item.quantity - 1)} /><Text style={styles.name}>{item.quantity}</Text><Button title="+" size="sm" variant="outline" onPress={() => void update(item.id, item.quantity + 1)} /></View></View><Button title="Remove" variant="outline" size="sm" onPress={() => void update(item.id, 0)} /></Card>; }} ListFooterComponent={<View style={styles.summary}><Text style={styles.title}>Order summary</Text><View style={styles.row}><Text style={styles.body}>Subtotal</Text><Text style={styles.body}>{money(subtotal)}</Text></View><View style={styles.row}><Text style={styles.body}>Estimated tax</Text><Text style={styles.body}>{money(tax)}</Text></View><View style={styles.row}><Text style={styles.body}>Shipping</Text><Text style={styles.body}>{shipping ? money(shipping) : 'Free'}</Text></View><View style={styles.row}><Text style={styles.name}>Estimated total</Text><Text style={styles.name}>{money(subtotal + tax + shipping)}</Text></View><Text style={styles.body}>Final totals are confirmed at checkout. Shipping is free for orders of ₹999 or more.</Text><Button title="Continue to checkout" onPress={() => navigation.navigate('Checkout')} /></View>} />;
}

type Address = { firstName: string; lastName: string; phone: string; line1: string; line2: string; city: string; state: string; pincode: string; country: string };
export function CheckoutScreen() {
  const { colors, spacing, typography, radius } = useTheme();
  const navigation = useNavigation<any>();
  const user = useAuthStore((state) => state.user);
  const [address, setAddress] = useState<Address>({ firstName: user?.firstName ?? '', lastName: user?.lastName ?? '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '', country: 'India' });
  const set = (key: keyof Address, value: string) => setAddress((current) => ({ ...current, [key]: value }));
  const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: colors.background.screen }, content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl }, title: { ...typography.h3, color: colors.text.primary }, body: { ...typography.body2, color: colors.text.secondary }, label: { ...typography.caption, color: colors.text.secondary }, field: { minHeight: 48, borderWidth: 1, borderColor: colors.border.medium, borderRadius: radius.md, paddingHorizontal: spacing.md, backgroundColor: colors.background.primary, color: colors.text.primary, ...typography.body1 } });
  const checkout = useMutation({ mutationFn: async () => {
    const required: Array<[keyof Address, string]> = [['firstName','first name'],['lastName','last name'],['phone','phone number'],['line1','street address'],['city','city'],['state','state'],['pincode','postal code'],['country','country']];
    const missing = required.find(([key]) => !address[key].trim());
    if (missing) throw new Error(`Enter your ${missing[1]} to continue.`);
    if (address.phone.replace(/\D/g, '').length < 10) throw new Error('Enter a valid phone number with at least 10 digits.');
    if (address.pincode.trim().length < 5) throw new Error('Enter a valid postal code.');
    const result = await apiClient.post<Envelope<{ order: OrderSummary; payment: { id: string } }>>('/orders/checkout', { shippingAddress: address, billingAddress: address });
    const paymentId = result.data.order.paymentId ?? result.data.payment.id;
    const checkoutUrl = paymentService.getHostedCheckoutUrl(paymentId);
    try { await Linking.openURL(checkoutUrl); } catch { Alert.alert('Order created', 'Your order is waiting for payment. Open it from My Orders to continue checkout.'); }
    return result.data.order.id;
  }, onSuccess: (orderId) => navigation.replace('OrderSuccess', { orderId }), onError: (error: any) => Alert.alert('Could not start checkout', error?.message ?? 'Please review your address and try again.') });
  const field = (label: string, key: keyof Address, placeholder: string, keyboardType?: 'default' | 'phone-pad' | 'number-pad') => <View style={{ gap: spacing.xs }}><Text style={styles.label}>{label}</Text><TextInput style={styles.field} value={address[key]} onChangeText={(value) => set(key, value)} placeholder={placeholder} placeholderTextColor={colors.text.tertiary} keyboardType={keyboardType} autoCapitalize={key === 'pincode' || key === 'phone' ? 'none' : 'words'} maxLength={key === 'phone' ? 15 : key === 'pincode' ? 10 : 120} /></View>;
  return <ScrollView style={styles.page} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled"><Text style={styles.title}>Delivery details</Text><Text style={styles.body}>Your sports gear will be delivered to this address. Payments are securely handled by Razorpay.</Text><View style={{ flexDirection: 'row', gap: spacing.sm }}>{field('First name','firstName','First name')}{field('Last name','lastName','Last name')}</View>{field('Phone number','phone','10-digit phone number','phone-pad')}{field('Address line 1','line1','House, building, street')}{field('Address line 2 (optional)','line2','Apartment, landmark')}{field('City','city','City')}{field('State','state','State')}{field('Postal code','pincode','PIN code','number-pad')}{field('Country','country','Country')}<Button title="Continue to Razorpay" loading={checkout.isPending} disabled={checkout.isPending} onPress={() => checkout.mutate()} /><Text style={styles.body}>This app sells physical sports equipment. No payment-card details are stored by Playmate.</Text></ScrollView>;
}

export function OrdersScreen() {
  const { colors, spacing, typography } = useTheme();
  const navigation = useNavigation<any>();
  const orders = useQuery({ queryKey: ['orders', 'my'], queryFn: () => apiClient.get<Envelope<{ items: OrderSummary[] }>>('/orders/my', { params: { page: 1, perPage: 30 } }).then((response) => response.data) });
  const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: colors.background.screen }, content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl }, title: { ...typography.h3, color: colors.text.primary }, body: { ...typography.body2, color: colors.text.secondary }, row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' } });
  if (orders.isLoading) return <LoadingState label="Loading your orders…" />;
  if (orders.isError) return <ErrorState title="Could not load orders" description="Check your connection and retry." action={<Button title="Retry" variant="outline" onPress={() => void orders.refetch()} />} />;
  return <FlatList style={styles.page} contentContainerStyle={styles.content} data={orders.data?.items ?? []} keyExtractor={(item) => item.id} refreshControl={<RefreshControl refreshing={orders.isRefetching} onRefresh={() => void orders.refetch()} />} ListHeaderComponent={<Text style={styles.title}>My orders</Text>} renderItem={({ item }) => <Card padding="md"><View style={styles.row}><Text style={styles.body}>{item.status.replaceAll('_', ' ')}</Text><Text style={styles.body}>{money(item.totalAmount)}</Text></View><Text style={styles.body}>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recent order'} · #{item.id.slice(0, 8)}</Text><Button title={item.status === 'PENDING' ? 'Continue payment' : 'View order'} size="sm" variant="outline" onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })} /></Card>} ListEmptyComponent={<EmptyState title="No orders yet" description="Your sports shop purchases will appear here." />} />;
}

export function OrderSuccessScreen() {
  const { colors, spacing, typography } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const orderId = route.params?.orderId as string;
  const order = useQuery({ queryKey: ['orders', orderId], queryFn: () => apiClient.get<Envelope<OrderSummary>>(`/orders/${orderId}`).then((response) => response.data), refetchInterval: (query) => query.state.data?.status === 'PENDING' ? 4000 : false });
  const value = order.data;
  const paid = value?.status === 'CONFIRMED';
  const openPayment = () => { if (value?.paymentId) void Linking.openURL(paymentService.getHostedCheckoutUrl(value.paymentId)); };
  const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: colors.background.screen }, content: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md }, title: { ...typography.h3, color: colors.text.primary, textAlign: 'center' }, body: { ...typography.body2, color: colors.text.secondary, textAlign: 'center' } });
  return <ScrollView contentContainerStyle={styles.content}><Text style={styles.title}>{paid ? 'Payment confirmed' : order.isError ? 'Order created' : 'Waiting for payment'}</Text><Text style={styles.body}>{paid ? `Your order #${orderId.slice(0, 8)} is confirmed. We’ll keep its status updated in My Orders.` : `Order #${orderId.slice(0, 8)} is saved. Complete payment in Razorpay, then return here to see confirmation.`}</Text>{!paid ? <Button title="Open Razorpay checkout" onPress={openPayment} disabled={!value?.paymentId} /> : null}<Button title="View my orders" variant={paid ? 'primary' : 'outline'} onPress={() => navigation.navigate('Orders')} /><Button title="Continue shopping" variant="outline" onPress={() => navigation.navigate('ShopHome')} /></ScrollView>;
}

export function OrderDetailScreen() {
  const { colors, spacing, typography } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const orderId = route.params?.orderId as string;
  const order = useQuery({ queryKey: ['orders', orderId], queryFn: () => apiClient.get<Envelope<OrderSummary>>(`/orders/${orderId}`).then((response) => response.data) });
  const items = useQuery({ queryKey: ['orders', orderId, 'items'], queryFn: () => apiClient.get<Envelope<Array<{ id: string; quantity: number; unitPrice: number; product: Product; variant: ProductVariant }>>>(`/orders/${orderId}/items`).then((response) => response.data) });
  const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: colors.background.screen }, content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl }, title: { ...typography.h3, color: colors.text.primary }, name: { ...typography.subtitle2, color: colors.text.primary }, body: { ...typography.body2, color: colors.text.secondary }, row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm } });
  if (order.isLoading) return <LoadingState label="Loading order…" />;
  if (order.isError || !order.data) return <ErrorState title="Order unavailable" description="This order may not exist or may belong to another account." action={<Button title="Back" variant="outline" onPress={() => navigation.goBack()} />} />;
  const value = order.data;
  return <ScrollView style={styles.page} contentContainerStyle={styles.content}><Text style={styles.title}>Order #{value.id.slice(0, 8)}</Text><View style={styles.row}><Text style={styles.body}>Status</Text><Text style={styles.name}>{value.status.replaceAll('_', ' ')}</Text></View><View style={styles.row}><Text style={styles.body}>Total</Text><Text style={styles.name}>{money(value.totalAmount)}</Text></View>{value.status === 'PENDING' && value.paymentId ? <Button title="Continue payment" onPress={() => { void Linking.openURL(paymentService.getHostedCheckoutUrl(value.paymentId!)); }} /> : null}<Text style={styles.title}>Items</Text>{items.isLoading ? <LoadingState label="Loading items…" /> : (items.data ?? []).map((item) => <Card key={item.id} padding="md"><Text style={styles.name}>{item.product.name}</Text><Text style={styles.body}>{[item.variant.size, item.variant.color].filter(Boolean).join(' · ') || item.variant.sku}</Text><View style={styles.row}><Text style={styles.body}>Qty {item.quantity}</Text><Text style={styles.body}>{money(item.unitPrice * item.quantity)}</Text></View></Card>)}</ScrollView>;
}
