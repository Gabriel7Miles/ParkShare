import type { Cart, CartItem } from "@/lib/types/cart";

const CART_STORAGE_KEY = "parkshare_cart";

export function getCart(): Cart {
  if (typeof window === "undefined") {
    return { items: [], createdAt: new Date() };
  }
  
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (!stored) {
      return { items: [], createdAt: new Date() };
    }
    const cart = JSON.parse(stored);
    // Convert date strings back to Date objects
    cart.items = cart.items.map((item: any) => ({
      ...item,
      reservedUntil: new Date(item.reservedUntil),
      space: {
        ...item.space,
        createdAt: new Date(item.space.createdAt),
        spots: item.space.spots?.map((spot: any) => ({
          ...spot,
          bookedUntil: spot.bookedUntil ? new Date(spot.bookedUntil) : undefined,
        })),
      },
    }));
    return cart;
  } catch (error) {
    console.error("[Cart] Error loading cart:", error);
    return { items: [], createdAt: new Date() };
  }
}

export function saveCart(cart: Cart): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (error) {
    console.error("[Cart] Error saving cart:", error);
  }
}

export function addToCart(item: CartItem): void {
  const cart = getCart();
  // Remove any existing item for the same space/spot
  cart.items = cart.items.filter(
    (i) => !(i.spaceId === item.spaceId && i.spotLabel === item.spotLabel)
  );
  cart.items.push(item);
  saveCart(cart);
}

export function removeFromCart(spaceId: string, spotLabel: string): void {
  const cart = getCart();
  cart.items = cart.items.filter(
    (i) => !(i.spaceId === spaceId && i.spotLabel === spotLabel)
  );
  saveCart(cart);
}

export function clearCart(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CART_STORAGE_KEY);
}

export function getCartItem(spaceId: string, spotLabel: string): CartItem | null {
  const cart = getCart();
  return cart.items.find(
    (i) => i.spaceId === spaceId && i.spotLabel === spotLabel
  ) || null;
}

