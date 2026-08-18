// store/actions.ts
import { createAction } from "@reduxjs/toolkit";
import { AppDispatch } from "./store";
import { ICompany } from "@/types";
import { setCompany } from "./Slice/UserSlice";
export const resetAppState = createAction("app/reset");
export const logoutAppState = createAction("app/logout");

export const switchCompany =
  (company: ICompany) =>
  async (dispatch: AppDispatch) => {
    dispatch(resetAppState());
    dispatch(setCompany(company));
  };
export const logoutUser =
  () =>
  async (dispatch: AppDispatch) => {
    dispatch(logoutAppState());
  };