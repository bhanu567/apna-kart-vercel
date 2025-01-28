import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const initialState = {
  isAuthenticated: false,
  isLoading: false,
  user: null,
};

export const registerUser = createAsyncThunk(
  "/auth/register",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_DOMAIN}/api/auth/register`,
        formData,
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      // Check if the error has a response (i.e., it's a server-side error)
      if (error.response) {
        // Return the error message from the server (message in the response body)
        console.log(error, "error");

        return rejectWithValue(error.response.data);
      } else {
        // Handle other types of errors (like network issues)
        return rejectWithValue({ message: "An unexpected error occurred." });
      }
    }
  }
);

export const loginUser = createAsyncThunk(
  "/auth/login",

  async (formData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_DOMAIN}/api/auth/login`,
        formData,
        {
          withCredentials: true,
        }
      );

      return response.data;
    } catch (error) {
      if (error.response) {
        return rejectWithValue(error.response.data);
      } else {
        return rejectWithValue({ message: "An unexpected error occurred." });
      }
    }
  }
);

export const logoutUser = createAsyncThunk(
  "/auth/logout",

  async ({ rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_DOMAIN}/api/auth/logout`,
        {},
        {
          withCredentials: true,
        }
      );

      return response.data;
    } catch (error) {
      if (error.response) {
        return rejectWithValue(error.response.data);
      } else {
        return rejectWithValue({ message: "An unexpected error occurred." });
      }
    }
  }
);

export const checkAuth = createAsyncThunk(
  "/auth/checkauth",

  async ({ rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_DOMAIN}/api/auth/check-auth`,
        {
          withCredentials: true,
          headers: {
            "Cache-Control":
              "no-store, no-cache, must-revalidate, proxy-revalidate",
          },
        }
      );
      return response.data;
    } catch (error) {
      if (error.response) {
        return rejectWithValue(error.response.data);
      } else {
        return rejectWithValue({ message: "An unexpected error occurred." });
      }
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action) => {},
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
      })
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        console.log(action);

        state.isLoading = false;
        state.user = action.payload.success ? action.payload.user : null;
        state.isAuthenticated = action.payload.success;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
      })
      .addCase(checkAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.success ? action.payload.user : null;
        state.isAuthenticated = action.payload.success;
      })
      .addCase(checkAuth.rejected, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
      })
      .addCase(logoutUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
      });
  },
});

export const { setUser } = authSlice.actions;
export default authSlice.reducer;
