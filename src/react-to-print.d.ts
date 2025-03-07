import { RefObject } from 'react';

declare module 'react-to-print' {
  export interface UseReactToPrintOptions {
    content: () => HTMLElement | null;
    documentTitle?: string;
    onBeforeGetContent?: () => Promise<void> | void;
    onBeforePrint?: () => Promise<void> | void;
    onAfterPrint?: () => void;
    removeAfterPrint?: boolean;
    copyStyles?: boolean;
    pageStyle?: string;
    bodyClass?: string;
  }

  export type UseReactToPrintHookContent = () => HTMLElement | null;
  export type UseReactToPrintFn = () => void;

  export function useReactToPrint(options: UseReactToPrintOptions): UseReactToPrintFn;

  export interface PrintContextConsumer {
    handlePrint: () => void;
  }

  export default function ReactToPrint(props: any): JSX.Element;
} 