import { useEffect } from 'react';

interface SEOHelmetProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogUrl?: string;
}

const SEOHelmet = ({ 
  title = "Star Seekers - Cosmic Gaming Platform | Space Adventures Await",
  description = "Join Star Seekers, the ultimate cosmic gaming platform featuring epic space battles, stellar mining, trading adventures, and faction-based gameplay. Choose your destiny among ONI, MUD, or USTUR factions.",
  keywords = "Star Seekers, space games, cosmic gaming, faction warfare, stellar mining, space trading, online gaming, sci-fi games, browser games, multiplayer games",
  ogImage = "https://star-seekers.com/logoazul.png",
  ogUrl = "https://star-seekers.com/"
}: SEOHelmetProps) => {
  
  useEffect(() => {
    // Update document title
    document.title = title;
    
    // Update meta tags
    const updateMetaTag = (property: string, content: string) => {
      let metaTag = document.querySelector(`meta[name="${property}"], meta[property="${property}"]`);
      if (metaTag) {
        metaTag.setAttribute('content', content);
      } else {
        metaTag = document.createElement('meta');
        if (property.startsWith('og:') || property.startsWith('twitter:')) {
          metaTag.setAttribute('property', property);
        } else {
          metaTag.setAttribute('name', property);
        }
        metaTag.setAttribute('content', content);
        document.head.appendChild(metaTag);
      }
    };
    
    // Update all meta tags
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords);
    updateMetaTag('og:title', title);
    updateMetaTag('og:description', description);
    updateMetaTag('og:image', ogImage);
    updateMetaTag('og:url', ogUrl);
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', ogImage);
    updateMetaTag('twitter:url', ogUrl);
    
    // Update canonical link
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (canonicalLink) {
      canonicalLink.href = ogUrl;
    }
    
  }, [title, description, keywords, ogImage, ogUrl]);

  return null;
};

export default SEOHelmet;