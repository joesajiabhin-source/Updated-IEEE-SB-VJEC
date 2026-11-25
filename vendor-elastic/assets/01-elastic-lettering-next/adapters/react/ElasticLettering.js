"use client";
import { createElement, forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { mountElasticLettering } from "../../src/elastic-lettering.js";
const EMPTY = Object.freeze({});
const ElasticLettering = forwardRef(function ElasticLetteringComponent({ options = EMPTY, onReady, onError, style, ...props }, ref) {
  const host = useRef(null), live = useRef(null), latest = useRef(options), loading = useRef(null);
  const callbacks = useRef({ onReady, onError }), handle = useRef(null);
  latest.current = options;
  callbacks.current = { onReady, onError };
  if (handle.current === null) handle.current = Object.freeze({
    getState: () => live.current?.getState(),
    replay: () => live.current?.replay(),
    release: () => live.current?.release()
  });
  useImperativeHandle(ref, () => handle.current, []);
  function observeReadiness(owner, work) {
    const revision = ++owner.revision;
    const current = () => loading.current === owner && owner.revision === revision;
    Promise.resolve(work).then(() => current()).then((ready) => {
      if (ready && current() && owner.controller.getState().ready && !owner.announced) {
        owner.announced = true;
        callbacks.current.onReady?.(handle.current);
      }
    }, (error) => {
      if (current()) callbacks.current.onError?.(error);
    });
  }
  useEffect(() => {
    let controller;
    try {
      controller = mountElasticLettering(host.current, latest.current);
    } catch (error) {
      callbacks.current.onError?.(error);
      return;
    }
    live.current = controller;
    const owner = { controller, revision: 0, announced: false };
    loading.current = owner;
    observeReadiness(owner, controller.ready);
    return () => {
      loading.current = null;
      controller.destroy();
      live.current = null;
    };
  }, []);
  useEffect(() => {
    const owner = loading.current;
    if (!owner) return;
    observeReadiness(owner, owner.controller.update(options));
    return () => {
      owner.revision++;
    };
  }, [options]);
  return createElement("div", { ...props, ref: host, style: { height: 720, ...style }, "data-delivery-adapter": "react" });
});
var stdin_default = ElasticLettering;
export {
  ElasticLettering,
  stdin_default as default
};
