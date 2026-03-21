import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { mockMentorSessions, type MentorSession, type SessionStatus } from '../../../shared/api/mocks/mentorSessions';

interface MentorSessionsState {
  sessions: MentorSession[];
}

const initialState: MentorSessionsState = {
  sessions: mockMentorSessions,
};

export const mentorSessionsSlice = createSlice({
  name: 'mentorSessions',
  initialState,
  reducers: {
    bookSession: (state, action: PayloadAction<Omit<MentorSession, 'id' | 'status' | 'roomId' | 'createdAt'>>) => {
      const session: MentorSession = {
        ...action.payload,
        id: `session-${Date.now()}`,
        status: 'pending',
        roomId: null,
        createdAt: new Date().toISOString(),
      };
      state.sessions.push(session);
    },
    updateSessionStatus: (state, action: PayloadAction<{ sessionId: string; status: SessionStatus; roomId?: string }>) => {
      const session = state.sessions.find((s) => s.id === action.payload.sessionId);
      if (session) {
        session.status = action.payload.status;
        if (action.payload.roomId) {
          session.roomId = action.payload.roomId;
        }
        // Generate room ID when approving
        if (action.payload.status === 'approved' && !session.roomId) {
          session.roomId = `room-${Math.random().toString(36).slice(2, 10)}`;
        }
      }
    },
  },
});

export const { bookSession, updateSessionStatus } = mentorSessionsSlice.actions;

// Selectors
export const selectAllSessions = (state: { mentorSessions: MentorSessionsState }) =>
  state.mentorSessions.sessions;

export const selectSessionsByMentor = (mentorId: string) => (state: { mentorSessions: MentorSessionsState }) =>
  state.mentorSessions.sessions.filter((s) => s.mentorId === mentorId);

export const selectSessionsByStudent = (studentId: string) => (state: { mentorSessions: MentorSessionsState }) =>
  state.mentorSessions.sessions.filter((s) => s.studentId === studentId);

export const selectPendingSessions = (mentorId: string) => (state: { mentorSessions: MentorSessionsState }) =>
  state.mentorSessions.sessions.filter((s) => s.mentorId === mentorId && s.status === 'pending');

export const selectApprovedSessions = (state: { mentorSessions: MentorSessionsState }) =>
  state.mentorSessions.sessions.filter((s) => s.status === 'approved');

export default mentorSessionsSlice.reducer;
