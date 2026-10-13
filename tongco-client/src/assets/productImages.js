import compressionShirt from './img/nc.png';
import runningShoes from './img/ns.jpg';
import nikeSocks from './img/nsocks.jpg';
import adidasTshirt from './img/at.jpg';
import adidasHoodie from './img/ah.jpg';
import adidasSocks from './img/asocks.jpg';
import pumaCap from './img/pm.jpg';
import pumaSocks from './img/pms.jpg';
import headphonesImage from './img/headphones.jpg';

const productImages = {
  'Nike Compression Shirt': compressionShirt,
  'Nike Running Shoes': runningShoes,
  'Nike Socks': nikeSocks,

  'Adidas T-shirt': adidasTshirt,
  'Adidas Hoodie': adidasHoodie,
  'Adidas Socks': adidasSocks,

  'Puma Sports Cap': pumaCap,
  'Puma Socks': pumaSocks,

  'Wireless Headphones': headphonesImage,
};

export const getFallbackProductImage = (product) => {
  return productImages[product?.name] || '';
};

export const getProductImage = (product) => {
  if (
    product?.image &&
    typeof product.image === 'string' &&
    product.image.trim() !== ''
  ) {
    return product.image;
  }

  return getFallbackProductImage(product);
};

export default productImages;