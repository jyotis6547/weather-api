import { Component, OnInit } from '@angular/core';
import { LayoutService } from '../../core/layout.service';
import { environment } from "src/environments/environment";
import { language } from "src/environments/language";
import { ApiService } from "src/app/service/api.service";
import { NotificationService } from "src/app/service/notification.service";
import { ConsoleService } from "src/app/service/console.service";
@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss'],
})
export class TopbarComponent implements OnInit {
  toolbarButtonMarginClass = 'ms-1 ms-lg-3';
  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';
  toolbarUserAvatarHeightClass = 'symbol-30px symbol-md-40px';
  toolbarButtonIconSizeClass = 'svg-icon-1';
  headerLeft: string = 'menu';

  constructor(private logger: ConsoleService,private layout: LayoutService,public api: ApiService, private notification : NotificationService) {}
  data:any;
  interval;
  modules = [];
  ngOnInit(): void {
    this.data = this.api.decryptData(localStorage.getItem('token-detail'));
    
    this.getNotifications() 

    this.headerLeft = this.layout.getProp('header.left') as string;
     
  }

  
  
  notificationsList=[];
  created:any;
  notifyLength:any;
  getNotifications() {
     
        if(this.data.process_id==2 && this.data.role_id==3 ){
          this.api.getAPI(environment.API_URL + "notification/get-notifications?tasking__created_by_id="+this.data.user_id).subscribe((res) => {
            if(res.status==environment.SUCCESS_CODE){

             this.notificationsList=res.data;
             
            } else if(res.status==environment.ERROR_CODE) {
                this.notification.displayMessage(res.message);
            } else {
              this.notification.displayMessage(language[environment.DEFAULT_LANG].unableSubmit);
            }
          });
        }
        
        else if(this.data.process_id==3){
          this.api.getAPI(environment.API_URL + "notification/get-notifications?process_id="+this.data.process_id +'&tasking_group='+this.data.tasking_id).subscribe((res) => {
            if(res.status==environment.SUCCESS_CODE){

             this.notificationsList=res.data;
             
            } else if(res.status==environment.ERROR_CODE) {
                this.notification.displayMessage(res.message);
            } else {
              this.notification.displayMessage(language[environment.DEFAULT_LANG].unableSubmit);
            }
          });


        }
        else{
          this.api.getAPI(environment.API_URL + "notification/get-notifications").subscribe((res) => {
            if(res.status==environment.SUCCESS_CODE){

             this.notificationsList=res.data;
             
            } else if(res.status==environment.ERROR_CODE) {
                this.notification.displayMessage(res.message);
            } else {
              this.notification.displayMessage(language[environment.DEFAULT_LANG].unableSubmit);
            }
          });


        }

        
      
  }
  
}
