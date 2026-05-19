import { Backdrop, Box, Typography } from "@mui/material";
import { keyframes } from "@mui/system";
import { useUIStore } from "../store";
import Logo from "../assets/loading_logo.jpg";

const floatBounce = keyframes`
  0%, 100% {
    transform: translateY(0) scale(1) rotate(0deg);
  }
  20% {
    transform: translateY(-28px) scale(1.08, 0.92) rotate(-4deg);
  }
  40% {
    transform: translateY(0) scale(0.92, 1.08) rotate(2deg);
  }
  60% {
    transform: translateY(-14px) scale(1.04, 0.96) rotate(-2deg);
  }
  80% {
    transform: translateY(0) scale(0.96, 1.04) rotate(1deg);
  }
`;

const shadowPulse = keyframes`
  0%, 100% {
    transform: scale(1);
    opacity: 0.35;
  }
  20% {
    transform: scale(0.6);
    opacity: 0.15;
  }
  60% {
    transform: scale(0.75);
    opacity: 0.25;
  }
`;

const glowPulse = keyframes`
  0%, 100% {
    filter: drop-shadow(0 0 0px rgba(255,255,255,0.0));
  }
  50% {
    filter: drop-shadow(0 0 12px rgba(255,255,255,0.5));
  }
`;

const textFade = keyframes`
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
`;


const MIN_DURATION = 1500;

export default function GlobalLoading() {
  const loadingCount = useUIStore((state) => state.loadingCount);

  return (
    <Backdrop
      open={loadingCount > 0}
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 999,
        backdropFilter: "blur(6px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 1.5,
      }}
    >
      <Box
        component="img"
        src={Logo}
        alt="Loading..."
        sx={{
          width: 90,
          height: 90,
          animation: `
            ${floatBounce} 1.8s cubic-bezier(0.4, 0, 0.2, 1) infinite,
            ${glowPulse} 2s ease-in-out infinite
          `,
        }}
      />

      <Box
        sx={{
          width: 50,
          height: 10,
          borderRadius: "50%",
          background: "rgba(0,0,0,0.25)",
          animation: `${shadowPulse} 1.8s ease-in-out infinite`,
        }}
      />

      <Typography
        variant="body2"
        sx={{
          color: "white",
          letterSpacing: 1,
          animation: `${textFade} 1.5s ease-in-out infinite`,
        }}
      >
        Loading...
      </Typography>
    </Backdrop>
  );
}