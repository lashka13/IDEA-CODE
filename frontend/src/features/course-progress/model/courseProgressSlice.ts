import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { CourseProgress } from '../../../shared/types';

interface CourseProgressState {
  progress: Record<string, CourseProgress[]>; // materialId -> lessons progress
  activeLessonId: string | null;
}

const initialState: CourseProgressState = {
  progress: {},
  activeLessonId: null,
};

export const courseProgressSlice = createSlice({
  name: 'courseProgress',
  initialState,
  reducers: {
    setActiveLesson: (state, action: PayloadAction<string>) => {
      state.activeLessonId = action.payload;
    },
    completeLesson: (state, action: PayloadAction<{ materialId: string; lessonId: string }>) => {
      const { materialId, lessonId } = action.payload;
      if (!state.progress[materialId]) {
        state.progress[materialId] = [];
      }
      const existing = state.progress[materialId].find((p) => p.lessonId === lessonId);
      if (existing) {
        existing.completed = true;
      } else {
        state.progress[materialId].push({ lessonId, completed: true });
      }
    },
    saveQuizScore: (
      state,
      action: PayloadAction<{ materialId: string; lessonId: string; score: number; total: number }>
    ) => {
      const { materialId, lessonId, score, total } = action.payload;
      if (!state.progress[materialId]) {
        state.progress[materialId] = [];
      }
      const existing = state.progress[materialId].find((p) => p.lessonId === lessonId);
      if (existing) {
        existing.quizScore = score;
        existing.quizTotal = total;
      } else {
        state.progress[materialId].push({ lessonId, completed: false, quizScore: score, quizTotal: total });
      }
    },
  },
});

export const { setActiveLesson, completeLesson, saveQuizScore } = courseProgressSlice.actions;

export const selectCourseProgress = (materialId: string) => (state: { courseProgress: CourseProgressState }) =>
  state.courseProgress.progress[materialId] || [];

export const selectActiveLesson = (state: { courseProgress: CourseProgressState }) =>
  state.courseProgress.activeLessonId;

export const selectLessonCompleted =
  (materialId: string, lessonId: string) => (state: { courseProgress: CourseProgressState }) =>
    state.courseProgress.progress[materialId]?.find((p) => p.lessonId === lessonId)?.completed ?? false;

export default courseProgressSlice.reducer;
