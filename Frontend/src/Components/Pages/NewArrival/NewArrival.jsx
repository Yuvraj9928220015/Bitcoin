import './NewArrival.css';

const categories = [
    {
        id: 1,
        name: 'Necklace',
        imageSrc: '/NewArrivals-1.webp',
        altText: 'Necklace Collection',
        link: '/shop/necklaces'
    },
    {
        id: 2,
        name: 'Pendants',
        imageSrc: '/NewArrivals-2.webp',
        altText: 'Pendants Collection',
        link: '/shop/pendants'
    },
    {
        id: 3,
        name: 'Rings',
        imageSrc: '/NewArrivals-3.webp',
        altText: 'Rings Collection',
        link: '/shop/rings'
    },
    {
        id: 4,
        name: 'Earrings',
        imageSrc: '/NewArrivals-4.webp',
        altText: 'Earrings Collection',
        link: '/shop/earrings'
    },
    {
        id: 5,
        name: 'Sets',
        imageSrc: '/NewArrivals-5.webp',
        altText: 'Sets Collection',
        link: '/shop/sets'
    }
];

export default function NewArrival() {
    return (
        <div className="new-arrival">
            <div className="banner">
                <img
                    src="/NewArrivals-2.webp"
                    alt="Bitcoin Jewelry Collection"
                    className="banner-image"
                />
                <div className="banner-overlay">
                    <div className="banner-content">
                        <h1>New Arrivals</h1>
                    </div>
                </div>
            </div>

            <div className="category-grid">
                {categories.map((category) => (
                    <a href={category.link} key={category.id} className="category-item-link">
                        <div className="category-item">
                            <div className="category-image">
                                <img
                                    src={category.imageSrc}
                                    alt={category.altText}
                                />
                            </div>
                            <div className="category-overlay">
                                <h3>{category.name}</h3>
                            </div>
                        </div>
                    </a>
                ))}
            </div>
        </div>
    );
}