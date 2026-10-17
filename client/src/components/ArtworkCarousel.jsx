import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, A11y } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

function getImages(artwork) {
  const source = Array.isArray(artwork?.images) ? artwork.images : [];
  const images = source.map((item) => typeof item === 'string' ? { url: item, alt: artwork?.title || 'Artwork' } : item)
    .filter((item) => item?.url);
  if (!images.length && artwork?.img) images.push({ url: artwork.img, alt: artwork.title || 'Artwork' });
  return images;
}

export default function ArtworkCarousel({ artwork, className = '' }) {
  const images = getImages(artwork);
  if (!images.length) return <div className={`artwork-image-empty ${className}`}>No image available</div>;
  if (images.length === 1) {
    return <img className={`artwork-carousel-single ${className}`} src={images[0].url} alt={images[0].alt || artwork.title} loading="lazy" draggable={false} />;
  }
  return (
    <div className={`artwork-carousel ${className}`} aria-label={`${artwork.title} image gallery`}>
      <Swiper modules={[Navigation, Pagination, A11y]} navigation pagination={{ clickable: true }} spaceBetween={12} slidesPerView={1} loop={images.length > 2}>
        {images.map((image, index) => (
          <SwiperSlide key={`${image.url}-${index}`}>
            <img src={image.url} alt={image.alt || `${artwork.title}, image ${index + 1}`} loading={index === 0 ? 'eager' : 'lazy'} draggable={false} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
