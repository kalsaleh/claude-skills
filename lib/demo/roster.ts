import { linkedInUrl } from "../linkedin";

export const DEMO_COMPANY = "Harbourline";
export const DEMO_NOW = "2026-10-09";

export type RosterPerson = {
  name: string;
  slug: string;
  url: string;
  title: string;
};

export const DEMO_YOU: RosterPerson = {
  name: "Alex Rowan",
  slug: "alex-rowan-harbourline",
  url: linkedInUrl("alex-rowan-harbourline"),
  title: "Senior Product Manager",
};

export const DEMO_COLLEAGUES: RosterPerson[] = [
  {
    name: "Priya Nandakumar",
    slug: "priya-nandakumar",
    url: linkedInUrl("priya-nandakumar"),
    title: "Staff Engineer",
  },
  {
    name: "Mateo Alvarez",
    slug: "mateo-alvarez",
    url: linkedInUrl("mateo-alvarez"),
    title: "Account Executive",
  },
  {
    name: "Helen Cho",
    slug: "helen-cho",
    url: linkedInUrl("helen-cho"),
    title: "Design Lead",
  },
  {
    name: "Samir El-Sayed",
    slug: "samir-elsayed",
    url: linkedInUrl("samir-elsayed"),
    title: "Customer Success Lead",
  },
  {
    name: "Ines Berger",
    slug: "ines-berger",
    url: linkedInUrl("ines-berger"),
    title: "Finance Partner",
  },
];

export const DEMO_ROSTER: RosterPerson[] = [DEMO_YOU, ...DEMO_COLLEAGUES];

export function demoColleaguePaste(): string {
  return DEMO_COLLEAGUES.map((person) => person.url).join("\n");
}
