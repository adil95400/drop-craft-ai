/**
 * @module analytics/mixpanel
 * @description Lightweight Mixpanel integration via their JS snippet.
 */

declare global {
  interface Window {
    mixpanel: {
      init: (token: string, config?: Record<string, unknown>) => void
      track: (event: string, properties?: Record<string, unknown>) => void
      identify: (id: string) => void
      people: {
        set: (props: Record<string, unknown>) => void
      }
      track_pageview: (props?: Record<string, unknown>) => void
      reset: () => void
    }
  }
}

let initialised = false

export function initMixpanel(token: string) {
  if (initialised || !token) return
  initialised = true

  // Mixpanel snippet (v2 lightweight)
  const script = document.createElement('script')
  script.innerHTML = `(function(f,b){if(!b.__SV){var e,g,i,h;window.mixpanel=b;b._i=[];b.init=function(e,f,c){function g(a,d){var b=d.split(".");2==b.length&&(a=a[b[0]],d=b[1]);a[d]=function(){a.push([d].concat(Array.prototype.slice.call(arguments,0)))}}var a=b;"undefined"!==typeof c?a=b[c]=[]:c="mixpanel";a.people=a.people||[];a.toString=function(a){var d="mixpanel";"mixpanel"!==c&&(d+="."+c);a||(d+=" (stub)");return d};a.people.toString=function(){return a.toString(1)+".people (stub)"};i="disable time_event track track_pageview track_links track_forms track_with_groups add_group set_group remove_group register register_once alias unregister identify name_tag set_config reset opt_in_tracking opt_out_tracking has_opted_in_tracking has_opted_out_tracking clear_opt_in_out_tracking start_batch_senders people.set people.set_once people.unset people.increment people.append people.union people.track_charge people.clear_charges people.delete_user people.remove".split(" ");for(h=0;h<i.length;h++)g(a,i[h]);var j="set set_once union unset remove delete".split(" ");a.get_group=function(){function b(c){d[c]=function(){call2_args=arguments;call2=[c].concat(Array.prototype.slice.call(call2_args,0));a.push([e,call2])}}for(var d={},e=["get_group"].concat(Array.prototype.slice.call(arguments,0)),c=0;c<j.length;c++)b(j[c]);return d};b._i.push([e,f,c])};b.__SV=1.2;}})(document,window.mixpanel||[]);`
  document.head.appendChild(script)

  // Wait for snippet to execute
  requestAnimationFrame(() => {
    window.mixpanel?.init(token, {
      track_pageview: false, // we handle it manually
      persistence: 'localStorage',
    })
  })
}

export function trackMixpanelPageView(path: string) {
  if (!initialised || !window.mixpanel) return
  window.mixpanel.track_pageview({ page: path })
}

export function trackMixpanelEvent(name: string, props?: Record<string, unknown>) {
  if (!initialised || !window.mixpanel) return
  window.mixpanel.track(name, props)
}

export function identifyMixpanelUser(userId: string, traits?: Record<string, unknown>) {
  if (!initialised || !window.mixpanel) return
  window.mixpanel.identify(userId)
  if (traits) window.mixpanel.people.set(traits)
}

export function resetMixpanel() {
  if (!initialised || !window.mixpanel) return
  window.mixpanel.reset()
}
