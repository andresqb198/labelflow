import { ApolloLink, FetchResult, Observable } from "@apollo/client";

import { isInWindowScope } from "../../utils/detect-scope";

// Ways to know that the server is ready
let isServerReady = false;
let resolveIsServerReadyPromise: (() => void) | undefined;
let rejectIsServerReadyPromise: ((reason: any) => void) | undefined;
const isServerReadyPromise = new Promise<void>((resolve, reject) => {
  resolveIsServerReadyPromise = resolve;
  rejectIsServerReadyPromise = reject;
});

const waitServerReady = async (callback: (error?: Error) => void) => {
  try {
    await isServerReadyPromise;
    callback();
  } catch (error) {
    callback(error);
  }
};

const setServerReady = () => {
  if (resolveIsServerReadyPromise) {
    resolveIsServerReadyPromise();
  } else {
    console.error(
      "Cannot resolve the isServerReadyPromise in client, this should not happen"
    );
  }
  isServerReady = true;
};

const checkServerReady = async () => {
  if (!isInWindowScope) {
    console.log("Not in window scope, service worker does not exist");
    return;
  }
  const wb = window.workbox;
  if (!wb) {
    if (rejectIsServerReadyPromise) {
      rejectIsServerReadyPromise(
        "GraphQL client-side server can't launch because workbox is unavailable, are you on Firefox in incognito mode?"
      );
    } else {
      console.error(
        "Cannot reject the isServerReadyPromise in client, this should not happen"
      );
    }

    isServerReady = true;
    return;
  }
  const sw = await wb.getSW();
  if (
    sw.state === "activated" || // Nominal case, service worker already installed and running, no new service worker waiting
    sw.state === "installed" // Service worker already installed and running, but there is a new service worker waiting
  ) {
    setServerReady();
    return;
  }
  const listenerFunction = () => {
    setServerReady();
    wb.removeEventListener("activated", listenerFunction);
  };
  wb.addEventListener("activated", listenerFunction);
};

checkServerReady();

export const awaitServiceWorkerLink = new ApolloLink((operation, forward) => {
  if (!isServerReady) {
    return new Observable<FetchResult>((observer) => {
      waitServerReady((error) => {
        if (error) {
          observer.error.bind(observer)(error);
          return;
        }

        const forwarded = forward(operation);

        forwarded.subscribe({
          next: observer.next.bind(observer),
          complete: observer.complete.bind(observer),
          error: observer.error.bind(observer),
        });
      });
    });
  }
  return forward(operation);
});