import FeaturedImageReview from '../assets/Images/Review_Img.jpg';
export default function FeaturedImage() {
  return (
    <section className="section container text-center" style={{ paddingTop: '1rem', paddingBottom: '3rem' }}>
      <div className="standard-img-card">
        <img src={FeaturedImageReview} alt="Studio Atmosphere" />
      </div>
    </section>
  );
}
