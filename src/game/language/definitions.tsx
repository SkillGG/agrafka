import React from "react"
import { MouseEventHandler } from "react"
import { Language } from "."

export type InjectableField<T> = {
  raw: string
  fill(fill: T): string
}

export const isInjectable = (n: any): n is InjectableField<any> =>
  n.fill && typeof n.fill === "function" && n.raw

export const isXFill: (n: any) => boolean = (
  n: any,
): n is XFill<any> => n.xfill && typeof n.xfill === "function"

export type XFill<T> = {
  xfill?(fill: T): JSX.Element
}

export type XFillOnClick<T> = InjectableField<T> &
  XFill<T & { onClick: MouseEventHandler }>

export const reasonToString = (
  reason: string | InjectableField<{ value: string }>,
  lang: Language,
  value?: string,
): string => {
  if (typeof reason === "string") return reason
  else return reason.fill({ value: value || lang.unknownReason })
}

export const UserBackXFill = (inp: string, cls: string) => {
  return ({
    value,
    onClick,
  }: {
    value: string
    onClick: MouseEventHandler
  }) => (
    <>
      {inp}{" "}
      <span className={cls} onClick={onClick}>
        {value}
      </span>
      :
    </>
  )
}
