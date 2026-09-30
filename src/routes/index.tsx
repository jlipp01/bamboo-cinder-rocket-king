import { createFileRoute } from "@tanstack/react-router";
import { AirwaveApp } from "@/components/airwave-app";

export const Route = createFileRoute("/")({ component: AirwaveApp });
