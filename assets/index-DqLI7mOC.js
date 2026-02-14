import{C as M,a as g,L as x,B as b,p as v,b as N,c as j,d as L,r as t,P as E,j as s,T as C,R as D,e as A}from"./vendor-JjATHiTI.js";(function(){const c=document.createElement("link").relList;if(c&&c.supports&&c.supports("modulepreload"))return;for(const e of document.querySelectorAll('link[rel="modulepreload"]'))u(e);new MutationObserver(e=>{for(const a of e)if(a.type==="childList")for(const n of a.addedNodes)n.tagName==="LINK"&&n.rel==="modulepreload"&&u(n)}).observe(document,{childList:!0,subtree:!0});function d(e){const a={};return e.integrity&&(a.integrity=e.integrity),e.referrerPolicy&&(a.referrerPolicy=e.referrerPolicy),e.crossOrigin==="use-credentials"?a.credentials="include":e.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function u(e){if(e.ep)return;e.ep=!0;const a=d(e);fetch(e.href,a)}})();M.register(g,x,b,v,N,j,L);function P({config:o}){const[c,d]=t.useState(!0),[u,e]=t.useState(!1),[a,n]=t.useState({}),[I,O]=t.useState({}),[U,w]=t.useState("month"),[B,F]=t.useState(null),[V,_]=t.useState(null),[G,J]=t.useState(!1),[X,f]=t.useState({}),[i,q]=t.useState(null),[z,Q]=t.useState({ca:0,assur:0,counts:{Terminaux:0,Mobile:0,Broadband:0,MIG:0,MEV:0,MP:0,Cyber:0}}),m=t.useCallback(()=>{e(!0);const h=new Date().getTime(),l="https://corsproxy.io/?"+encodeURIComponent(o.url+"&t="+h);fetch(l).then(r=>r.text()).then(r=>{E.parse(r,{header:!0,skipEmptyLines:!0,complete:p=>{y(p.data),e(!1)}})}).catch(()=>e(!1))},[o.url]);t.useEffect(()=>{m()},[m]);const y=h=>{let l={};o.team.trim().split(`
`).forEach(r=>{if(r.includes(":")){const[p,S]=r.split(":");l[p.trim()]=S.trim()}}),f(l),d(!1)};return s.jsx("div",{className:"modern-dashboard",children:i&&s.jsx("div",{className:"ps-trophy-container",children:s.jsxs("div",{className:"ps-trophy-card",children:[s.jsx("div",{className:"ps-trophy-icon",children:s.jsx("div",{className:"ps-gold-circle",children:s.jsx(C,{size:26,color:"white"})})}),s.jsxs("div",{className:"ps-trophy-text",children:[s.jsxs("div",{className:"ps-trophy-user",children:[i.name," A PASSÉ UN NIVEAU !"]}),s.jsx("div",{className:"ps-trophy-title",children:i.title}),s.jsx("div",{className:"ps-trophy-sub",children:i.sub})]})]})})})}const R={url:"https://docs.google.com/spreadsheets/d/e/2PACX-1vRQhU0168lFGtFdLX0oqNU6r9Dy87d_mW7zeSJ2LVrf_I87RxC4SbLFZiXSJcaQa8rRvuxDN8kmH0iF/pub?output=csv",objectifs:{CA:21760,Terminaux:312,Mobile:127,Broadband:69,MIG:101,MEV:57,Cyber:27,MP:11,Assurance:42},team:`
    00017561 : Johan
    00015162 : Emre
    00016295 : Irvan
    00040258 : Amaury
    00009572 : Jean-Maxime
    00040373 : Yannis
    00017785 : Lucas
    00014065 : Nicolas
    00015199 : Elliot
    00016661 : Mathieu
    00014897 : Ludovyk
    00014896 : Steeve
    `};function T(){return s.jsx(P,{config:R})}D.createRoot(document.getElementById("root")).render(s.jsx(A.StrictMode,{children:s.jsx(T,{})}));
