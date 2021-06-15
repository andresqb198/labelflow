import { chakra, HTMLChakraProps } from "@chakra-ui/react";
import * as React from "react";

export const EmptyStateCaughtUp = React.forwardRef<
  SVGSVGElement,
  HTMLChakraProps<"svg"> & { iconColor?: string }
>(({ iconColor, ...rest }: { iconColor?: string }, ref) => {
  return (
    <chakra.svg
      width="250"
      height="200"
      fill="none"
      viewBox="0 0 250 200"
      {...rest}
      ref={ref}
    >
      <path
        fill="#F3F7FF"
        fillRule="evenodd"
        d="M81 133h83a7 7 0 100-14s-6-3.134-6-7 3.952-7 8.826-7H177a7 7 0 100-14h-22a7 7 0 100-14h40a7 7 0 100-14H97a7 7 0 100 14H57a7 7 0 100 14h25a7 7 0 110 14H42a7 7 0 100 14h39a7 7 0 100 14zm107-35a7 7 0 1014 0 7 7 0 00-14 0z"
        clipRule="evenodd"
      />
      <mask id="path-2-inside-1" fill="#fff">
        <path
          fillRule="evenodd"
          d="M101 123.991c-.166.006-.333.009-.5.009-8.56 0-15.5-7.611-15.5-17s6.94-17 15.5-17c.167 0 .334.003.5.009V80a4 4 0 014-4h41a4 4 0 014 4v61a2 2 0 01-2 2h-45a2 2 0 01-2-2v-17.009zm0-8.511V98.52a6.227 6.227 0 00-.5-.02c-3.995 0-7.233 3.806-7.233 8.5s3.238 8.5 7.233 8.5c.168 0 .335-.007.5-.02z"
          clipRule="evenodd"
        />
      </mask>
      <path
        fill="#fff"
        fillRule="evenodd"
        d="M101 123.991c-.166.006-.333.009-.5.009-8.56 0-15.5-7.611-15.5-17s6.94-17 15.5-17c.167 0 .334.003.5.009V80a4 4 0 014-4h41a4 4 0 014 4v61a2 2 0 01-2 2h-45a2 2 0 01-2-2v-17.009zm0-8.511V98.52a6.227 6.227 0 00-.5-.02c-3.995 0-7.233 3.806-7.233 8.5s3.238 8.5 7.233 8.5c.168 0 .335-.007.5-.02z"
        clipRule="evenodd"
      />
      <path
        fill="#75A4FE"
        d="M100.5 124v-2.5 2.5zm.5-33.991l-.087 2.498 2.587.09V90.01H101zm0 8.511h2.5v-2.307l-2.3-.185-.2 2.492zm-.087 22.973c-.137.005-.275.007-.413.007v5c.196 0 .392-.003.587-.01l-.174-4.997zm-.413.007c-6.967 0-13-6.27-13-14.5h-5c0 10.547 7.847 19.5 18 19.5v-5zm-13-14.5c0-8.23 6.033-14.5 13-14.5v-5c-10.153 0-18 8.953-18 19.5h5zm13-14.5c.138 0 .276.002.413.007l.174-4.997c-.195-.007-.391-.01-.587-.01v5zm3-2.491V80h-5v10.009h5zm0-10.009a1.5 1.5 0 011.5-1.5v-5a6.5 6.5 0 00-6.5 6.5h5zm1.5-1.5h41v-5h-41v5zm41 0a1.5 1.5 0 011.5 1.5h5a6.5 6.5 0 00-6.5-6.5v5zm1.5 1.5v61h5V80h-5zm0 61a.5.5 0 01.5-.5v5a4.5 4.5 0 004.5-4.5h-5zm.5-.5h-45v5h45v-5zm-45 0a.5.5 0 01.5.5h-5a4.5 4.5 0 004.5 4.5v-5zm.5.5v-17.009h-5V141h5zm0-25.52V98.52h-5v16.96h5zm-2.3-19.452a8.75 8.75 0 00-.7-.028v5c.101 0 .201.004.3.012l.4-4.984zm-.7-.028c-5.739 0-9.733 5.318-9.733 11h5c0-3.707 2.482-6 4.733-6v-5zm-9.733 11c0 5.682 3.994 11 9.733 11v-5c-2.251 0-4.733-2.293-4.733-6h-5zm9.733 11c.235 0 .468-.009.7-.028l-.4-4.984a3.723 3.723 0 01-.3.012v5z"
        mask="url(#path-2-inside-1)"
      />
      <path
        fill="#A4C3FE"
        d="M141 85.182h2.5a2.5 2.5 0 00-2.5-2.5v2.5zm0 0v-2.5a2.5 2.5 0 00-2.5 2.5h2.5zm0 18.318V85.182h-2.5V103.5h2.5zm0 0h-2.5a2.5 2.5 0 002.5 2.5v-2.5zm0 0v2.5a2.5 2.5 0 002.5-2.5H141zm0-18.318V103.5h2.5V85.182H141zm0 24h2.5a2.5 2.5 0 00-2.5-2.5v2.5zm0 0v-2.5a2.5 2.5 0 00-2.5 2.5h2.5zm0 4.743v-4.743h-2.5v4.743h2.5zm0 0h-2.5a2.5 2.5 0 002.5 2.5v-2.5zm0 0v2.5a2.5 2.5 0 002.5-2.5H141zm0-4.743v4.743h2.5v-4.743H141z"
      />
      <path
        fill="#75A4FE"
        d="M67.128 135.5V133a2.5 2.5 0 00-2.5 2.5h2.5zm0 0h-2.5a2.5 2.5 0 002.5 2.5v-2.5zm6.872 0h-6.872v2.5H74v-2.5zm0 0v2.5a2.5 2.5 0 002.5-2.5H74zm0 0h2.5A2.5 2.5 0 0074 133v2.5zm-6.872 0H74V133h-6.872v2.5zm114 0V133a2.5 2.5 0 00-2.5 2.5h2.5zm0 0h-2.5a2.5 2.5 0 002.5 2.5v-2.5zm2.872 0h-2.872v2.5H184v-2.5zm0 0v2.5a2.5 2.5 0 002.5-2.5H184zm0 0h2.5a2.5 2.5 0 00-2.5-2.5v2.5zm-2.872 0H184V133h-2.872v2.5zM154 133a2.5 2.5 0 00-2.5 2.5h2.5V133zm22.428 0H154v2.5h22.428V133zm2.5 2.5a2.5 2.5 0 00-2.5-2.5v2.5h2.5zm-2.5 2.5a2.5 2.5 0 002.5-2.5h-2.5v2.5zM154 138h22.428v-2.5H154v2.5zm-2.5-2.5a2.5 2.5 0 002.5 2.5v-2.5h-2.5zm-71.5 0V133a2.5 2.5 0 00-2.5 2.5H80zm0 0h-2.5A2.5 2.5 0 0080 138v-2.5zm21.454 0H80v2.5h21.454v-2.5zm0 0v2.5a2.5 2.5 0 002.5-2.5h-2.5zm0 0h2.5a2.5 2.5 0 00-2.5-2.5v2.5zM80 135.5h21.454V133H80v2.5z"
      />
      <path
        stroke="#A4C3FE"
        strokeLinecap="round"
        strokeWidth="2.5"
        d="M128 35s-4 6.32-4 11c0 5.556 4.654 8.044 4.654 14.063 0 4.582-4.654 9.1-4.654 9.1M116 46c-.873 5.513 3 6.532 3 11.475 0 3.762-3 7.525-3 7.525M134.795 43.474c-1.321 3.42-.579 5.503 0 6.73 1.238 2.622 3.205 4.886 3.205 7.554 0 4.648-3.205 8.947-3.205 8.947"
      />
    </chakra.svg>
  );
});
