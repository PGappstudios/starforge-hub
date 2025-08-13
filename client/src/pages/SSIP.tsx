import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ExternalLink, Smartphone, Book, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

// Carousel Component
const ImageCarousel = ({ images }: { images: { src: string; alt: string; }[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageError, setImageError] = useState<boolean[]>(new Array(images.length).fill(false));

  const nextImage = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };

  const handleImageError = (index: number) => {
    setImageError(prev => {
      const newState = [...prev];
      newState[index] = true;
      return newState;
    });
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        prevImage();
      } else if (event.key === 'ArrowRight') {
        nextImage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="relative w-full max-w-sm mx-auto mb-6">
      <div className="relative overflow-hidden rounded-lg bg-black/20 border border-white/20">
        {imageError[currentIndex] ? (
          <div className="w-full h-96 flex items-center justify-center bg-gradient-to-br from-blue-900/20 to-purple-900/20">
            <div className="text-center p-8">
              <Smartphone className="w-16 h-16 mx-auto mb-4 text-blue-400" />
              <h3 className="text-white font-semibold mb-2">iOS App Screenshot</h3>
              <p className="text-gray-400 text-sm">Preview coming soon</p>
            </div>
          </div>
        ) : (
          <img
            src={images[currentIndex].src}
            alt={images[currentIndex].alt}
            className="w-full h-96 object-cover transition-opacity duration-300"
            onError={() => handleImageError(currentIndex)}
            loading="lazy"
          />
        )}
        
        {/* Navigation buttons */}
        <button
          onClick={prevImage}
          className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition-all duration-200"
          disabled={images.length <= 1}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        
        <button
          onClick={nextImage}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition-all duration-200"
          disabled={images.length <= 1}
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Indicators */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                index === currentIndex ? 'bg-white' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      </div>
      
      {/* Image counter */}
      <div className="text-center mt-2">
        <span className="text-sm text-gray-400">
          {currentIndex + 1} of {images.length}
        </span>
      </div>
    </div>
  );
};

const SSIP = () => {
  const [coloringBookError, setColoringBookError] = useState(false);
  
  // iOS App Screenshots
  const iosScreenshots = [
    { src: "/assets/SSIP/460x0w.webp", alt: "Star Seekers iOS - App Screenshot 1" },
    { src: "/assets/SSIP/460x0w (1).webp", alt: "Star Seekers iOS - App Screenshot 2" },
    { src: "/assets/SSIP/460x0w (2).webp", alt: "Star Seekers iOS - App Screenshot 3" },
    { src: "/assets/SSIP/460x0w (3).webp", alt: "Star Seekers iOS - App Screenshot 4" },
  ];

  return (
    <div className="min-h-screen cosmic-bg">
      <div className="max-w-6xl mx-auto p-4">
        {/* Navigation */}
        <div className="mb-8">
          <Link to="/dashboard">
            <Button variant="ghost" className="mb-4 text-gray-300 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Game Hub
            </Button>
          </Link>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="mb-8">
            <img 
              src="/assets/F4video/SA-PBTP-Black.svg" 
              alt="Star Seekers Logo" 
              className="mx-auto h-32 w-auto mb-6 filter invert"
            />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4 font-futuristic">
            Star Seekers IP
          </h1>
          <p className="text-xl text-gray-300 mb-6 max-w-3xl mx-auto leading-relaxed">
            Dive into the vast universe of Star Seekers - an immersive space exploration IP 
            featuring mobile gaming, interactive content, and creative experiences across multiple platforms.
          </p>
          <div className="flex justify-center gap-4">
            <Badge variant="outline" className="text-primary border-primary bg-primary/10">
              <Star className="w-4 h-4 mr-2" />
              Gaming
            </Badge>
            <Badge variant="outline" className="text-blue-400 border-blue-400 bg-blue-400/10">
              <Smartphone className="w-4 h-4 mr-2" />
              Mobile App
            </Badge>
            <Badge variant="outline" className="text-purple-400 border-purple-400 bg-purple-400/10">
              <Book className="w-4 h-4 mr-2" />
              Publishing
            </Badge>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* iOS App Card */}
          <Card className="bg-black/10 border-white/20 backdrop-blur-md hover:bg-black/40 transition-all duration-300">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <Smartphone className="w-8 h-8 text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-white text-2xl font-futuristic">iOS Mobile App</CardTitle>
                  <p className="text-gray-400">Available on the App Store</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-gray-300 leading-relaxed">
                Experience the full Star Seekers universe on your iPhone or iPad. Navigate through 
                cosmic battlefields, explore distant planets, and uncover the mysteries of the galaxy 
                in this immersive mobile gaming experience.
              </p>
              
              {/* iOS Screenshots Carousel */}
              <ImageCarousel images={iosScreenshots} />
              
              <div className="space-y-3">
                <h4 className="text-white font-semibold">Features:</h4>
                <ul className="text-gray-300 space-y-2">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    Brain Grid puzzle challenges
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    Find Your Crew matching games
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    Multiple game modes and challenges
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    Stunning cosmic visuals and audio
                  </li>
                </ul>
              </div>

              <div className="pt-4">
                <Button 
                  asChild 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3"
                >
                  <a 
                    href="https://apps.apple.com/pt/app/star-seekers/id6738390556?l=en-GB" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2"
                  >
                    <Smartphone className="w-5 h-5" />
                    Download on App Store
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Coloring Book Card */}
          <Card className="bg-black/10 border-white/20 backdrop-blur-md hover:bg-black/40 transition-all duration-300">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-500/20 rounded-lg">
                  <Book className="w-8 h-8 text-purple-400" />
                </div>
                <div>
                  <CardTitle className="text-white text-2xl font-futuristic">Coloring Book</CardTitle>
                  <p className="text-gray-400">Available on Amazon</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-gray-300 leading-relaxed">
                Join the cosmic adventure with Star Seekers Coloring Book N.1! Follow brave space 
                explorers through the Star Atlas universe as they encounter friendly robots, discover 
                alien worlds, and embark on interstellar missions. Perfect for young astronauts aged 4-8!
              </p>
              
              {/* Coloring Book Cover */}
              <div className="flex justify-center mb-6">
                {coloringBookError ? (
                  <div className="max-w-xs h-80 flex items-center justify-center bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-lg border border-white/20">
                    <div className="text-center p-8">
                      <Book className="w-16 h-16 mx-auto mb-4 text-purple-400" />
                      <h3 className="text-white font-semibold mb-2">Star Seekers</h3>
                      <h4 className="text-purple-400 font-semibold mb-2">Coloring Book N.1</h4>
                      <div className="text-yellow-400 font-bold text-sm bg-yellow-400/20 px-3 py-1 rounded-full">
                        AGE 4-8
                      </div>
                    </div>
                  </div>
                ) : (
                  <img 
                    src="/assets/SSIP/71VSjCx0GgL._SL1293_.jpg" 
                    alt="Star Seekers Coloring Book Cover"
                    className="max-w-xs rounded-lg shadow-2xl border border-white/20 transition-transform duration-300 hover:scale-105"
                    onError={() => setColoringBookError(true)}
                    loading="lazy"
                  />
                )}
              </div>
              
              <div className="space-y-3">
                <h4 className="text-white font-semibold">What's Inside:</h4>
                <ul className="text-gray-300 space-y-2">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    50+ detailed coloring pages
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    High-quality paper and binding
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    Star Atlas universe adventures
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    Ages 4-8 and beyond!
                  </li>
                </ul>
              </div>

              <div className="pt-4">
                <Button 
                  asChild 
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3"
                >
                  <a 
                    href="https://www.amazon.com/dp/B0CVPB4K18" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2"
                  >
                    <Book className="w-5 h-5" />
                    Buy on Amazon
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* About Star Seekers IP */}
        <Card className="bg-black/20 border-white/10 backdrop-blur-md mb-8">
          <CardHeader>
            <CardTitle className="text-3xl font-futuristic text-center text-white">
              About Star Seekers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <p className="text-gray-300 text-lg leading-relaxed">
                  Star Seekers is a comprehensive science fiction intellectual property that spans 
                  across multiple platforms and mediums. From mobile gaming to interactive web experiences, 
                  from coloring books to digital art, Star Seekers creates an immersive universe where 
                  players and fans can explore the cosmos, engage in epic battles, and discover the 
                  mysteries that lie beyond the stars.
                </p>
              </div>
              <div className="flex justify-center">
                <div className="relative rounded-lg overflow-hidden border border-white/20 shadow-2xl max-w-md">
                  <video 
                    autoPlay 
                    loop 
                    muted 
                    playsInline
                    className="w-full h-auto"
                  >
                    <source src="/assets/ss-ip/SS.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
              </div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6 mt-8">
              <div className="text-center space-y-3">
                <div className="p-4 bg-primary/20 rounded-lg w-fit mx-auto">
                  <Star className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-white font-semibold text-lg">Rich Universe</h3>
                <p className="text-gray-400 text-sm">
                  Explore a detailed cosmos filled with unique characters, planets, and storylines
                </p>
              </div>
              
              <div className="text-center space-y-3">
                <div className="p-4 bg-blue-500/20 rounded-lg w-fit mx-auto">
                  <Smartphone className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-white font-semibold text-lg">Multi-Platform</h3>
                <p className="text-gray-400 text-sm">
                  Available across mobile, web, and print for a complete entertainment experience
                </p>
              </div>
              
              <div className="text-center space-y-3">
                <div className="p-4 bg-purple-500/20 rounded-lg w-fit mx-auto">
                  <Book className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="text-white font-semibold text-lg">Creative Engagement</h3>
                <p className="text-gray-400 text-sm">
                  Interactive content that lets fans participate in and shape the Star Seekers world
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="text-center bg-gradient-to-r from-primary/20 to-purple-600/20 rounded-lg p-8">
          <h2 className="text-3xl font-futuristic text-white mb-4">
            Ready to Begin Your Journey?
          </h2>
          <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
            Download the app, grab the coloring book, and immerse yourself in the 
            Star Seekers universe. Adventure awaits among the stars!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              asChild 
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8"
            >
              <a 
                href="https://apps.apple.com/pt/app/star-seekers/id6738390556?l=en-GB" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <Smartphone className="w-5 h-5" />
                Get iOS App
              </a>
            </Button>
            <Button 
              asChild 
              size="lg"
              className="bg-purple-600 hover:bg-purple-700 text-white px-8"
            >
              <a 
                href="https://www.amazon.com/dp/B0CVPB4K18" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <Book className="w-5 h-5" />
                Buy Coloring Book
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SSIP;