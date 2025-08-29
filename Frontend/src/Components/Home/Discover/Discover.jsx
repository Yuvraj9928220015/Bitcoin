import "./Discover.css"

function Discover() {
    const jewelryItems = [
        {
            id: 1,
            image: "/Bzero-6.webp",
            title: "Serpenti",
            description: "An icon of infinite transformation, crafted with mastery and reinvented many times over since 1948."
        },
        {
            id: 2,
            image: "/Bzero-4.webp",
            title: "B.zero1",
            description: "The icon that rewrites the codes of design with an audacious spirit and creative experimentation."
        },
        {
            id: 3,
            image: "/Bzero-8.webp",
            title: "Divas' Dream",
            description: "A celebration of timeless elegance and joyful femininity captured by an iconic, universal motif."
        },
        {
            id: 4,
            image: "/Bzero-9.webp",
            title: "Bvlgari Tubogas",
            description: "Its sinuous twists of gold and versatile design make it an icon of eclectic innovation."
        },
        {
            id: 5,
            image: "/Bzero-14.webp",
            title: "Octo",
            description: "Defined by its iconic octagonal case, it blends a resolutely Italian style and mechanical mastery."
        }
    ];

    return (
        <>
            <div data-aos="fade-up" className="discover-section">
                <div className="container-fluid">
                    <div className="Section-Heading">
                        <div className="discover-Heading-title">Discover the Icons</div>
                    </div>

                    <div className="jewelry-grid">
                        {jewelryItems.map((item) => (
                            <div key={item.id} className="jewelry-card">
                                <div className="jewelry-image-container">
                                    <img
                                        src={item.image}
                                        alt={item.title}
                                        className="jewelry-image"
                                    />
                                </div>
                                <div className="jewelry-content">
                                    <h3 className="jewelry-title"><a href="">{item.title}</a></h3>
                                    <p className="jewelry-description">{item.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}

export default Discover;