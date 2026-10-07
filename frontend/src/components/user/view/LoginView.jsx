import React from "react";
import { Button } from "@mui/material";
import InputField from "../../../shared/shared/InputField/UI/InputField";
import PasswordField from "./PasswordField";
import { Link } from "react-router-dom";
import cisdLogo from "../../../assets/cisd-logo.png";

const LoginView = ({ onSubmit, control, errors, loginLoading }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-lime-50 via-white to-sky-50 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5 md:grid md:grid-cols-2">
        {/* Brand panel */}
        <div className="relative hidden md:block">
          <img
            src="/site/cisd-team.jpg"
            alt="CISD students"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b2a6b] via-[#0b2a6b]/80 to-[#0b2a6b]/30" />
          <div className="relative flex h-full flex-col justify-between p-10 text-white">
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-white p-2">
                <img src={cisdLogo} alt="CISD logo" className="h-9 w-auto object-contain" />
              </span>
              <span className="text-sm font-extrabold leading-tight">
                College of International
                <br />
                Skills Development
              </span>
            </div>
            <div>
              <h2 className="text-3xl font-extrabold leading-tight">
                Skills that turn into <span className="text-[#9bd13d]">careers.</span>
              </h2>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/80">
                Sign in to your CISD portal to manage your application, admission and fees.
              </p>
            </div>
          </div>
        </div>

        {/* Form panel */}
        <div className="flex items-center justify-center p-8 sm:p-12">
          <div className="w-full max-w-sm">
            <div className="mb-8 flex items-center gap-3 md:hidden">
              <img src={cisdLogo} alt="CISD logo" className="h-10 w-auto object-contain" />
              <span className="text-sm font-extrabold leading-tight text-[#0b2a6b]">
                College of International
                <br />
                Skills Development
              </span>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-[#0b2a6b]">Welcome back</h1>
            <p className="mt-2 text-slate-500">Sign in to continue to your portal.</p>

            <form onSubmit={onSubmit} className="mt-8 space-y-5">
              <InputField
                name="email"
                control={control}
                label="Email Address"
                type="email"
                errors={errors}
              />

              <PasswordField name="password" control={control} label="Password" errors={errors} />

              <div className="-mt-2 text-right">
                <Link to="/forgot-password" className="text-sm font-semibold text-[#0b2a6b] hover:underline">
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loginLoading}
                sx={{
                  py: 1.6,
                  borderRadius: "9999px",
                  textTransform: "none",
                  fontWeight: 700,
                  fontSize: "1rem",
                  boxShadow: "none",
                  backgroundColor: "#0b2a6b",
                  "&:hover": { backgroundColor: "#12388a", boxShadow: "none" },
                }}
              >
                {loginLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Signing in...
                  </span>
                ) : (
                  "Sign in"
                )}
              </Button>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 font-semibold uppercase tracking-wider text-slate-400">
                    New to CISD?
                  </span>
                </div>
              </div>

              <Link
                to="/signup"
                className="block w-full rounded-full border-2 border-[#7ab317] py-3 text-center text-sm font-bold text-[#5b8a0e] transition hover:bg-lime-50"
              >
                Create new account
              </Link>
            </form>

            <p className="mt-8 text-center text-xs text-slate-400">
              <Link to="/" className="font-semibold text-slate-500 hover:text-[#0b2a6b]">
                ← Back to website
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
