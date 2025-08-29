import Banner from "./Banner/Banner"
// import Discover from "./Discover/Discover"
import Header from "./Header/Header"
import "./Home.css"
import Main from "./Main/Main"
import Slider from "./Slider/Slider"
// import Universe from "./Universe/Universe"

function Home() {

    return (
        <>
            <div className="Home">
                <Banner />
                <Header />
                <Slider />
                <Main />
                {/* <Discover /> */}
                {/* <Universe /> */}
            </div>
        </>
    )
}

export default Home

