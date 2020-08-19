import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthenticationService } from "../../services/authentication.service";
import { IndicatorsService } from "../../services/indicators.service";
import { AlertService } from '../../services/alert.service';



import { User } from '../../_models/user.model';
import { Role } from '../../_models/roles.model';
import { GeneralStatus } from '../../_models/general-status.model';

@Component({
  selector: 'header-bar',
  templateUrl: './header-bar.component.html',
  styleUrls: ['./header-bar.component.scss']
})
export class HeaderBarComponent implements OnInit {
  private currentUser: User;
  private allRoles = Role;
  private generalStatus = GeneralStatus;
  private indicators = [];
  private currentRole = '';
  private params;

  private isHome ;

  constructor(private activeRoute: ActivatedRoute, private authenticationService: AuthenticationService, public router: Router, private indicatorService: IndicatorsService, private alertService: AlertService) {
    this.activeRoute.params.subscribe(routeParams => {
      this.params = routeParams;
      this.authenticationService.currentUser.subscribe(x => {
        this.currentUser = x;
        if (x) {
          this.currentRole = x.roles[0].description.toLowerCase()
          this.ngOnInit();
          this.getHeaderLinks();
          this.isHome =`/dashboard/${this.currentUser}`;
          // this.isHome = this.router.isActive( `/dashboard/${this.currentUser}` , true)
        }
      });
    })

  }

  private getCurrentRoute(){
    return this.router.isActive( `/dashboard/${this.currentRole}` , true);
  }

  ngOnInit() {
    this.indicators = this.authenticationService.userHeaders;
    // this.getHeaderLinks();
  }

  private goToView(indicator: any) {
    // //console.log(this.router.navigate(['/reload']), this.activeRoute.pathFromRoot.toString(), this.router.url.toString().indexOf('/indicator'))

    if (indicator === 'logo' || indicator === 'home') {
      this.router.navigate([`dashboard/${this.currentUser.roles[0].description.toLowerCase()}`]);
      return
    }


    let view = indicator.indicator.name;
    let primary_column = indicator.indicator.primary_field;

  }

  private getHeaderLinks() {
    if (this.indicators && !this.indicators.length && this.currentUser && !this.isCRP()) {
      this.indicatorService.getIndicatorsByUser(this.currentUser.id).subscribe(
        res => {
          // console.log("getHeaderLinks", res);
          this.indicators = res.data.filter(indicator => indicator.indicator.type = indicator.indicator.name.toLocaleLowerCase());
          this.authenticationService.userHeaders = this.indicators;
        },
        error => {
          console.log("getHeaderLinks", error);
          this.alertService.error(error);
        }
      )
    }

  }

  private isCRP() {
    if (this.currentUser) {
      // let mapped_roles = this.currentUser.roles.map(role => { return role.description });
      // let has_roles = mapped_roles.find(role_ => {
      //   return this.allRoles.crp.indexOf(role_) > -1
      // });
      // return has_roles
      return this.currentUser.crp ? true : false;
    }
    return false;
  }

  private logout() {
    this.authenticationService.logout();
    this.router.navigate(['/login']);
  }

}
