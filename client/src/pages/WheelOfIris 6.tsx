import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play } from 'lucide-react';

interface DiceResult {
  value: number;
  credits: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

const diceSides: DiceResult[] = [
  { value: 1, credits: 1 },  // Side 1 - gives 1 credit
  { value: 2, credits: 2 },  // Side 2 - gives 2 credits  
  { value: 3, credits: 3 },  // Side 3 - gives 3 credits
  { value: 4, credits: 4 },  // Side 4 - gives 4 credits
  { value: 5, credits: 5 },  // Side 5 - gives 5 credits
  { value: 6, credits: 6 }   // Side 6 - gives 6 credits
];

const DiceOfIris = () => {
  const [isRolling, setIsRolling] = useState(false);
  const [result, setResult] = useState<DiceResult | null>(null);
  const [totalCredits, setTotalCredits] = useState(0);
  const [rollHistory, setRollHistory] = useState<DiceResult[]>([]);
  const [diceRotation, setDiceRotation] = useState({ x: 0, y: 0, z: 0 });
  const [currentFace, setCurrentFace] = useState(0);
  const [diceScale, setDiceScale] = useState(1);
  const [diceGlow, setDiceGlow] = useState(0);
  const [showResultAnimation, setShowResultAnimation] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  
  const animationRef = useRef<number>();
  const rollSoundRef = useRef<HTMLAudioElement | null>(null);
  const stopSoundRef = useRef<HTMLAudioElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);

  // Credit management
  const STORAGE_KEYS = {
    credits: 'starSeekers_userCredits',
    rollHistory: 'starSeekers_rollHistory'
  };

  const loadCredits = useCallback(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.credits);
    return saved ? parseInt(saved, 10) : 0;
  }, []);

  const saveCredits = useCallback((credits: number) => {
    localStorage.setItem(STORAGE_KEYS.credits, credits.toString());
    setTotalCredits(credits);
  }, []);

  useEffect(() => {
    const credits = loadCredits();
    setTotalCredits(credits);
    
    // Initialize audio files
    try {
      // Dice roll sound
      const rollAudio = new Audio('/assets/game6/dice-95077.mp3');
      rollAudio.preload = 'auto';
      rollAudio.volume = 0.6;
      rollAudio.load();
      rollSoundRef.current = rollAudio;
      
      // Dice stop sound
      const stopAudio = new Audio('/assets/game6/correct-6033.mp3');
      stopAudio.preload = 'auto';
      stopAudio.volume = 0.7;
      stopAudio.load();
      stopSoundRef.current = stopAudio;
      
      // Add event listeners for debugging
      rollAudio.addEventListener('canplaythrough', () => {
        console.log('Roll sound loaded successfully');
      });
      
      stopAudio.addEventListener('canplaythrough', () => {
        console.log('Stop sound loaded successfully');
      });
      
      rollAudio.addEventListener('error', (e) => {
        console.error('Roll audio loading error:', e);
      });
      
      stopAudio.addEventListener('error', (e) => {
        console.error('Stop audio loading error:', e);
      });
    } catch (error) {
      console.error('Audio initialization failed:', error);
    }
  }, [loadCredits]);

  // Particle system functions
  const createParticles = useCallback((count: number, isExplosion: boolean = false) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const particle: Particle = {
        id: Math.random(),
        x: 400 + Math.random() * 100, // Center around dice area
        y: 300 + Math.random() * 100,
        vx: (Math.random() - 0.5) * (isExplosion ? 8 : 4),
        vy: (Math.random() - 0.5) * (isExplosion ? 8 : 4) - 2,
        life: 1,
        maxLife: 1,
        size: Math.random() * (isExplosion ? 8 : 4) + 2,
        color: isExplosion ? `hsl(${Math.random() * 60 + 320}, 70%, 60%)` : `hsl(${Math.random() * 360}, 70%, 60%)`
      };
      newParticles.push(particle);
    }
    setParticles(prev => [...prev, ...newParticles]);
    particlesRef.current = [...particlesRef.current, ...newParticles];
  }, []);

  const updateParticles = useCallback(() => {
    setParticles(prev => {
      const updated = prev.map(particle => ({
        ...particle,
        x: particle.x + particle.vx,
        y: particle.y + particle.vy,
        vy: particle.vy + 0.2, // gravity
        life: particle.life - 0.02
      })).filter(particle => particle.life > 0);
      
      particlesRef.current = updated;
      return updated;
    });
  }, []);

  const rollDice = useCallback(() => {
    if (isRolling) return;
    
    setIsRolling(true);
    setResult(null);
    
    // Play dice roll sound
    if (rollSoundRef.current) {
      try {
        rollSoundRef.current.currentTime = 0;
        const playPromise = rollSoundRef.current.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('Roll sound played successfully');
            })
            .catch(error => {
              console.log('Roll sound play failed - user interaction may be required:', error);
            });
        }
      } catch (error) {
        console.log('Roll sound play error:', error);
      }
    }
    
    // Roll a 6-sided dice - select random side
    const randomSideIndex = Math.floor(Math.random() * 6);
    const finalResult = diceSides[randomSideIndex];
    
    // Animate the dice roll
    const startTime = Date.now();
    const duration = 2000; // 2 seconds
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Fast spinning during roll, slowing down
      const speed = (1 - progress) * 20 + 1;
      setDiceRotation(prev => ({
        x: prev.x + speed * 3,
        y: prev.y + speed * 2,
        z: prev.z + speed * 4
      }));
      
      // Show random faces during animation
      if (Math.random() < 0.3) {
        const randomIndex = Math.floor(Math.random() * 6);
        setCurrentFace(diceSides[randomIndex].value);
      }
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // Roll complete - add dramatic finish animations
        setResult(finalResult);
        setCurrentFace(finalResult.value);
        setIsRolling(false);
        setShowResultAnimation(true);
        
        // Dice landing animation sequence
        setDiceScale(1.3); // Grow
        setDiceGlow(1);    // Glow effect
        
        setTimeout(() => {
          setDiceScale(0.9); // Shrink
        }, 150);
        
        setTimeout(() => {
          setDiceScale(1); // Back to normal
          setDiceGlow(0.5);
        }, 300);
        
        setTimeout(() => {
          setDiceGlow(0);
          setShowResultAnimation(false);
        }, 1000);
        
        // Play dice stop sound
        setTimeout(() => {
          if (stopSoundRef.current) {
            try {
              stopSoundRef.current.currentTime = 0;
              const playPromise = stopSoundRef.current.play();
              
              if (playPromise !== undefined) {
                playPromise
                  .then(() => {
                    console.log('Stop sound played successfully');
                  })
                  .catch(error => {
                    console.log('Stop sound play failed:', error);
                  });
              }
            } catch (error) {
              console.log('Stop sound play error:', error);
            }
          }
        }, 100); // Play stop sound shortly after dice stops
        
        // Award credits
        if (finalResult.credits > 0) {
          const newCredits = totalCredits + finalResult.credits;
          saveCredits(newCredits);
        }
        
        setRollHistory(prev => [finalResult, ...prev.slice(0, 9)]);
      }
    };
    
    createParticles(8); // Normal particles during roll
    animationRef.current = requestAnimationFrame(animate);
  }, [isRolling, updateParticles, totalCredits, saveCredits, createParticles]);

  const resetGame = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    saveCredits(0);
    setRollHistory([]);
    setResult(null);
    setIsRolling(false);
    setParticles([]);
    setDiceRotation({ x: 0, y: 0, z: 0 });
    setCurrentFace(0);
    setDiceScale(1);
    setDiceGlow(0);
    setShowResultAnimation(false);
    particlesRef.current = [];
  }, [saveCredits]);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen cosmic-bg">
      <div className="max-w-6xl mx-auto p-4">
        <div className="mb-6">
          <Link to="/dashboard">
            <Button variant="ghost" className="mb-4 text-gray-300 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Game Hub
            </Button>
          </Link>
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-2">Dice of Iris</h1>
            <p className="text-gray-300">Roll the cosmic dice and test your luck!</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Dice Section */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-800/50 border-purple-500/50">
              <CardHeader>
                <CardTitle className="text-center text-purple-400">
                  🎲 Cosmic Dice
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-6">
                {/* Dice Container */}
                <div className="relative">
                  {/* Particles Layer */}
                  <div className="absolute inset-0 pointer-events-none z-20">
                    {particles.map(particle => (
                      <div
                        key={particle.id}
                        className="absolute rounded-full"
                        style={{
                          left: `${particle.x}px`,
                          top: `${particle.y}px`,
                          width: `${particle.size}px`,
                          height: `${particle.size}px`,
                          backgroundColor: particle.color,
                          opacity: particle.life,
                          boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
                          transform: 'translate(-50%, -50%)'
                        }}
                      />
                    ))}
                  </div>
                  
                  {/* Dice */}
                  <div className="flex justify-center items-center h-80">
                    <div 
                      className="w-32 h-32 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl shadow-2xl flex items-center justify-center border-4 border-yellow-400"
                      style={{ 
                        transform: `rotateX(${diceRotation.x}deg) rotateY(${diceRotation.y}deg) rotateZ(${diceRotation.z}deg) scale(${diceScale})`,
                        transition: isRolling ? 'none' : 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                        filter: `drop-shadow(0 0 ${20 + diceGlow * 30}px rgba(255, 215, 0, ${0.5 + diceGlow * 0.5}))`,
                        boxShadow: `0 0 ${20 + diceGlow * 40}px rgba(255, 215, 0, ${diceGlow * 0.8})`,
                        animation: showResultAnimation ? 'pulse 0.5s ease-in-out' : 'none'
                      }}
                    >
                      <div 
                        className="text-6xl font-bold text-white drop-shadow-[0_0_8px_rgba(0,0,0,1)]"
                        style={{
                          textShadow: `0 0 ${10 + diceGlow * 20}px rgba(255, 255, 255, ${diceGlow * 0.8})`,
                          transform: showResultAnimation ? 'scale(1.1)' : 'scale(1)',
                          transition: 'all 0.3s ease-out'
                        }}
                      >
                        {currentFace}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex justify-center">
                  <Button 
                    onClick={rollDice}
                    disabled={isRolling}
                    className="bg-purple-600 hover:bg-purple-700 text-lg px-8 py-3"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    {isRolling ? 'Rolling...' : 'Roll Dice'}
                  </Button>
                </div>

                {/* Result Display */}
                {result && (
                  <div className="text-center p-6 bg-gray-700/50 rounded-lg border border-yellow-400/50">
                    {result.credits > 0 ? (
                      <>
                        <div className="text-6xl font-bold text-green-400 mb-2">
                          {result.credits}
                        </div>
                        <p className="text-xl text-white">
                          Credit{result.credits > 1 ? 's' : ''} Earned!
                        </p>
                        <p className="text-sm text-gray-300 mt-2">
                          You rolled: {result.value}
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="text-6xl font-bold text-gray-400 mb-2">
                          0
                        </div>
                        <p className="text-xl text-gray-300">
                          Better luck next time!
                        </p>
                        <p className="text-sm text-gray-400 mt-2">
                          You rolled: {result.value}
                        </p>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Stats & History Section */}
          <div className="space-y-6">
            {/* Credits Display */}
            <Card className="bg-gray-800/50 border-purple-500/50">
              <CardHeader>
                <CardTitle className="text-center text-purple-400">
                  🎫 Your Credits
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-4xl font-bold text-yellow-400 mb-2">
                  {totalCredits}
                </div>
                <p className="text-gray-300">Available Credits</p>
                <p className="text-xs text-gray-500 mt-2">1 credit = 1 game</p>
              </CardContent>
            </Card>

            {/* Dice Rules */}
            <Card className="bg-gray-800/50 border-purple-500/50">
              <CardHeader>
                <CardTitle className="text-purple-400 text-sm">
                  🎯 Dice Rules
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-300">Roll 1</span>
                  <div className="text-right">
                    <div className="text-green-400 font-bold">+1 credit</div>
                    <div className="text-gray-400 text-xs">16.7% chance</div>
                  </div>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-300">Roll 2</span>
                  <div className="text-right">
                    <div className="text-green-400 font-bold">+2 credits</div>
                    <div className="text-gray-400 text-xs">16.7% chance</div>
                  </div>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-300">Roll 3</span>
                  <div className="text-right">
                    <div className="text-blue-400 font-bold">+3 credits</div>
                    <div className="text-gray-400 text-xs">16.7% chance</div>
                  </div>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-300">Roll 4</span>
                  <div className="text-right">
                    <div className="text-purple-400 font-bold">+4 credits</div>
                    <div className="text-gray-400 text-xs">16.7% chance</div>
                  </div>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-300">Roll 5</span>
                  <div className="text-right">
                    <div className="text-orange-400 font-bold">+5 credits</div>
                    <div className="text-gray-400 text-xs">16.7% chance</div>
                  </div>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-300">Roll 6</span>
                  <div className="text-right">
                    <div className="text-yellow-400 font-bold">+6 credits</div>
                    <div className="text-gray-400 text-xs">16.7% chance</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Roll History */}
            {rollHistory.length > 0 && (
              <Card className="bg-gray-800/50 border-purple-500/50">
                <CardHeader>
                  <CardTitle className="text-purple-400 text-sm">
                    📜 Recent Rolls
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 max-h-64 overflow-y-auto">
                  {rollHistory.map((roll, index) => (
                    <div key={index} className="flex justify-between items-center text-sm p-2 bg-gray-700/30 rounded">
                      <span className="text-gray-300">Rolled: {roll.value}</span>
                      <span className={`font-bold ${roll.credits > 0 ? 'text-green-400' : 'text-gray-500'}`}>
                        {roll.credits > 0 ? `+${roll.credits} credit${roll.credits > 1 ? 's' : ''}` : 'No credits'}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiceOfIris;