type Frame = {
  time: number;
  frame: number;
};

type AnimationFrames = {
  totalDuration: number;
  frames: Frame[];
};

// map colorOffset to animation frames for each animation
const idleAnimation = (colorOffset: number): AnimationFrames => ({
  totalDuration: 400,
  frames: [
    { time: 100, frame: 0 + colorOffset },
    { time: 200, frame: 1 + colorOffset },
    { time: 300, frame: 2 + colorOffset },
    { time: 400, frame: 3 + colorOffset },
  ],
});

const walkAnimation = (colorOffset: number): AnimationFrames => ({
  totalDuration: 200,
  frames: [
    { time: 50, frame: 4 + colorOffset },
    { time: 100, frame: 5 + colorOffset },
    { time: 150, frame: 6 + colorOffset },
    { time: 200, frame: 7 + colorOffset },
  ],
});

const walkAnimationLeft = (colorOffset: number): AnimationFrames => ({
  totalDuration: 200,
  frames: [
    { time: 50, frame: 0 + colorOffset },
    { time: 100, frame: 1 + colorOffset },
    { time: 150, frame: 2 + colorOffset },
    { time: 200, frame: 3 + colorOffset },
  ],
});

const idleAnimationLeft = (colorOffset: number): AnimationFrames => ({
  totalDuration: 400,
  frames: [
    { time: 100, frame: 4 + colorOffset },
    { time: 200, frame: 5 + colorOffset },
    { time: 300, frame: 6 + colorOffset },
    { time: 400, frame: 7 + colorOffset },
  ],
}); 

export { idleAnimation, walkAnimation, walkAnimationLeft, idleAnimationLeft};
export type { AnimationFrames };