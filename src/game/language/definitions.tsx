import React from "react"
import { MouseEventHandler } from "react"
import { Language } from "."

export type InjectableField<T> = {
  raw: string
  fill(fill: T): string
}

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
