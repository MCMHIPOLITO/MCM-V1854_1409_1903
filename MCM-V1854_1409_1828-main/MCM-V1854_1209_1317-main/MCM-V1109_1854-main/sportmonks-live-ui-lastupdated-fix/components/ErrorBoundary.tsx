import React from 'react';
type State={hasError:boolean;error?:any};
export default class ErrorBoundary extends React.Component<{children:React.ReactNode},State>{
  constructor(p:any){super(p);this.state={hasError:false};}
  static getDerivedStateFromError(error:any){return{hasError:true,error};}
  componentDidCatch(error:any,info:any){console.error("ErrorBoundary caught:",error,info);}
  render(){if(this.state.hasError){return(<div style={{padding:20,background:'#2b1d1d',color:'#f5dada'}}>
    <h2>Something went wrong</h2><p>{String(this.state.error)}</p></div>);}return this.props.children;}
}
