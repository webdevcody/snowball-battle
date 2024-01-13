import { AnimationFrames } from './santaAnimation';

export class FrameIndexPattern {
  animationFrames: AnimationFrames;
  currentTime: number = 0;

  constructor(animationFrames: AnimationFrames) {
    this.animationFrames = animationFrames;
  }

  update(deltaTime: number) {
    this.currentTime += deltaTime;
    if (this.currentTime >= this.animationFrames.totalDuration) {
      this.currentTime = 0;
    }
  }

  getFrame(): number {
    for (let i = 0; i < this.animationFrames.frames.length; i++) {
      if (this.animationFrames.frames[i].time > this.currentTime) {
        return this.animationFrames.frames[i].frame;
      }
    }
    console.log(this.animationFrames, this.currentTime);
    throw new Error('No frame found');
  }
}