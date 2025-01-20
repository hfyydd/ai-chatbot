declare module 'react-plotly.js' {
  import { Component } from 'react';
  
  export interface PlotParams {
    data: any[];
    layout: any;
    style?: object;
  }
  
  export default class Plot extends Component<PlotParams> {}
} 