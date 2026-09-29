import React from "react";
import { Shell } from "../../ui/primitives";
import ViewHeader from "../../ui/ViewHeader";
import StatistikTab from "./StatistikTab";
import ProfilTab from "./ProfilTab";
import CommunityTab from "./CommunityTab";
import ArchivTab from "./ArchivTab";
import ErfolgeTab from "./ErfolgeTab";
import TagebuchTab from "./TagebuchTab";
import ProtokollLogView from "../ProtokollLogView";
import BlutzuckerView from "../BlutzuckerView";
import { ChipReihe } from "../../ui/Umschalter";

const TABS = [
  { id: "verlauf", label: "Protokolle" },
  { id: "archiv", label: "Archiv" },
  { id: "statistik", label: "Statistik" },
  { id: "erfolge", label: "Erfolge" },
  { id: "tagebuch", label: "Tagebuch" },
  { id: "profil", label: "Profil" },
  { id: "blutzucker", label: "Blutzucker" },
  { id: "community", label: "Community" },
];

// "Archiv"-Hub — bündelt alles, was der Rückschau/Dokumentation dient
// (Protokolle, Archiv, Statistik, Profil/Biomarker, Blutzucker, Community)
// unter einem gemeinsamen Reiter-Kopf. "Mehr" ist bewusst kein Reiter mehr
// hier, sondern ein eigenständiges Ziel der unteren Tab-Leiste (MehrView.jsx).
export default function PlanView({ planTab, setPlanTab, onHome }) {
  return (
    <Shell>
      <ViewHeader title="Archiv" onHome={onHome} />

      <ChipReihe name="Archiv-Bereiche" optionen={TABS} wert={planTab} onWahl={setPlanTab} />

      {planTab === "verlauf" && <ProtokollLogView embedded />}
      {planTab === "statistik" && <StatistikTab />}
      {planTab === "erfolge" && <ErfolgeTab />}
      {planTab === "profil" && <ProfilTab />}
      {planTab === "community" && <CommunityTab />}
      {planTab === "archiv" && <ArchivTab />}
      {planTab === "tagebuch" && <TagebuchTab />}
      {planTab === "blutzucker" && <BlutzuckerView embedded />}
    </Shell>
  );
}
