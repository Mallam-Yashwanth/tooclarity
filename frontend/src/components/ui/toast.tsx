// "use client";

// import * as React from "react";
// import * as ToastPrimitives from "@radix-ui/react-toast";
// import { cva } from "class-variance-authority";
// import { cn } from "@/lib/utils";

// const ToastProvider = ToastPrimitives.Provider;

// const ToastViewport = React.forwardRef<
//   React.ElementRef<typeof ToastPrimitives.Viewport>,
//   React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
// >(({ className, ...props }, ref) => (
//   <ToastPrimitives.Viewport
//     ref={ref}
//     className={cn(
//       "fixed bottom-0 right-0 z-50 flex max-h-screen w-full flex-col-reverse p-4 sm:max-w-[420px]",
//       className
//     )}
//     {...props}
//   />
// ));
// ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

// const toastVariants = cva(
//   "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-4 pr-6 shadow-lg transition-all",
//   {
//     variants: {
//       variant: {
//         default: "bg-background text-foreground",
//         destructive:
//           "destructive group border-destructive bg-destructive text-destructive-foreground",
//       },
//     },
//     defaultVariants: {
//       variant: "default",
//     },
//   }
// );

// const Toast = React.forwardRef<
//   React.ElementRef<typeof ToastPrimitives.Root>,
//   React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> & { variant?: "default" | "destructive" }
// >(({ className, variant, ...props }, ref) => (
//   <ToastPrimitives.Root
//     ref={ref}
//     className={cn(toastVariants({ variant }), className)}
//     {...props}
//   />
// ));
// Toast.displayName = ToastPrimitives.Root.displayName;

// const ToastTitle = React.forwardRef<
//   React.ElementRef<typeof ToastPrimitives.Title>,
//   React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
// >(({ className, ...props }, ref) => (
//   <ToastPrimitives.Title
//     ref={ref}
//     className={cn("text-sm font-semibold", className)}
//     {...props}
//   />
// ));
// ToastTitle.displayName = ToastPrimitives.Title.displayName;

// const ToastDescription = React.forwardRef<
//   React.ElementRef<typeof ToastPrimitives.Description>,
//   React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
// >(({ className, ...props }, ref) => (
//   <ToastPrimitives.Description
//     ref={ref}
//     className={cn("text-sm opacity-90", className)}
//     {...props}
//   />
// ));
// ToastDescription.displayName = ToastPrimitives.Description.displayName;

// export {
//   ToastProvider,
//   ToastViewport,
//   Toast,
//   ToastTitle,
//   ToastDescription,
// };
