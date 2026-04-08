declare module "react-simple-maps" {
  import {
    ComponentType,
    CSSProperties,
    ReactNode,
    MouseEventHandler,
  } from "react";

  export interface ComposableMapProps {
    projection?: string;
    projectionConfig?: Record<string, unknown>;
    style?: CSSProperties;
    width?: number;
    height?: number;
    children?: ReactNode;
  }

  export interface ZoomableGroupProps {
    zoom?: number;
    center?: [number, number];
    children?: ReactNode;
    [key: string]: unknown;
  }

  export interface GeographiesProps {
    geography: string | object;
    children: (props: { geographies: GeoFeature[] }) => ReactNode;
  }

  export interface GeoFeature {
    rsmKey: string;
    id: string | number;
    properties: Record<string, string>;
    [key: string]: unknown;
  }

  export interface GeographyProps {
    geography: GeoFeature;
    key?: string;
    onMouseEnter?: MouseEventHandler<SVGPathElement>;
    onMouseLeave?: MouseEventHandler<SVGPathElement>;
    onClick?: MouseEventHandler<SVGPathElement>;
    style?: {
      default?: CSSProperties & {
        fill?: string;
        stroke?: string;
        strokeWidth?: number;
        outline?: string;
      };
      hover?: CSSProperties & {
        fill?: string;
        stroke?: string;
        strokeWidth?: number;
        outline?: string;
      };
      pressed?: CSSProperties & {
        fill?: string;
        stroke?: string;
        strokeWidth?: number;
        outline?: string;
      };
    };
  }

  export const ComposableMap: ComponentType<ComposableMapProps>;
  export const ZoomableGroup: ComponentType<ZoomableGroupProps>;
  export const Geographies: ComponentType<GeographiesProps>;
  export const Geography: ComponentType<GeographyProps>;
}
