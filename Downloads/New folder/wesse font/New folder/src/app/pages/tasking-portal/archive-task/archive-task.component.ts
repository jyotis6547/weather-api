import { Component, OnInit, ViewChild, Input, ElementRef } from "@angular/core";
import { ApiService } from "src/app/service/api.service";
import { environment } from "src/environments/environment";
import { FormGroup, FormControl, Validators, FormGroupDirective } from "@angular/forms";
import { MatTableDataSource } from "@angular/material/table";
import { MatPaginator } from "@angular/material/paginator";
import { NotificationService } from "src/app/service/notification.service";
import { ConfirmationDialogComponent } from "src/app/confirmation-dialog/confirmation-dialog.component";
import { MatDialog } from "@angular/material/dialog";
import { language } from "src/environments/language";
import { Router } from '@angular/router';
import { ConsoleService } from "src/app/service/console.service";
import { of } from 'rxjs';
import { formatDate } from "@angular/common";

declare function closeModal(selector): any;
declare function openModal(selector): any;
declare var moment:any;
@Component({
  selector: 'app-archive-task',
  templateUrl: './archive-task.component.html',
  styleUrls: ['./archive-task.component.scss']
})
export class ArchiveTaskComponent implements OnInit {

  @ViewChild(MatPaginator) pagination: MatPaginator;
  @ViewChild("closebutton") closebutton;
  @ViewChild(FormGroupDirective) formGroupDirective: FormGroupDirective;

  dataSource: MatTableDataSource<any>;
  public permission={
    view:false,
    delete:false,
  };
  displayedColumns: string[] = [
		"task_number_dee",
    "task_name",
    "sponsoring_directorate",
    "reason",
    "authority_permission",
    "restore",
    "actions"
	  ];
  token_detail=this.api.decryptData(localStorage.getItem('token-detail'));
  archiveList:any;
  constructor(public api: ApiService, private notification : NotificationService,
    private dialog:MatDialog, private router : Router, private elementref : ElementRef,private logger:ConsoleService) { }

  ngOnInit(): void {
    this.getTasking()
    this.getAccess();
  }
  getTasking() {

    if(this.token_detail.process_id==1){
      this.api
      .getAPI(environment.API_URL + "transaction/archive_list")
      .subscribe((res) => {
        if(res.status==environment.SUCCESS_CODE){
          this.dataSource = new MatTableDataSource(res.data);
          this.archiveList = res.data;
          console.log('res.data',res.data)
          this.dataSource.paginator = this.pagination;


        }

      });
    }
    // else{
    //   this.api
    //   .getAPI(environment.API_URL + "transaction/tasking")
    //   .subscribe((res) => {
    //     if(res.status==environment.SUCCESS_CODE){
    //       this.dataSource = new MatTableDataSource(res.data);
    //       this.archiveList = res.data;
    //       this.dataSource.paginator = this.pagination;

    //     }

    //   });

    // }


  }
  filterValue:any;
  applyFilter(event: Event) {
    this.filterValue = (event.target as HTMLInputElement).value;
    if(this.filterValue){
      this.dataSource.filter = this.filterValue.trim().toLowerCase();
    } else {
      this.getTasking();
    }
  }
  moduleAccess: any;
  getAccess() {
    this.moduleAccess = this.api.getPageAction();
     if (this.moduleAccess) {
       let viewPermission = (this.moduleAccess).filter(function (access) { if (access.code == 'VIW') { return access.status; } }).map(function (obj) { return obj.status; });
       let archivePermission=(this.moduleAccess).filter(function(access){ if(access.code=='ARCHIVE') return access.status; }).map(function(obj) {return obj.status;});
       let deletePermission=(this.moduleAccess).filter(function(access){ if(access.code=='DEL') { return access.status;} }).map(function(obj) {return obj.status;});
       this.permission.view = viewPermission.length > 0 ? viewPermission[0] : false;
       this.permission.delete=deletePermission.length>0?deletePermission[0]:false;

     }

   }

   restoreDelete(id){
    console.log("ID",id);
    this.api.postAPI(environment.API_URL + "transaction/trial/status_restore", {
      tasking: id,
    }).subscribe((res)=>{
      if(res.status==environment.SUCCESS_CODE) {
        this.notification.success('Archived Task restored');
        this.getTasking();
      } else {
        this.notification.displayMessage(language[environment.DEFAULT_LANG].unableDelete);
      }
    });
   }

   approvedDelete(id) {
    let dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '350px',
      data: language[environment.DEFAULT_LANG].confirmMessage
    });
    dialogRef.afterClosed().subscribe(result => {
      if(result) {
        this.api.postAPI(environment.API_URL + "transaction/trial/status_delete", {
          id: id,
          status: 3,
          // authority_permission: '',
          // reason:''
        }).subscribe((res)=>{
          if(res.status==environment.SUCCESS_CODE) {
            this.notification.warn('Approved Task '+language[environment.DEFAULT_LANG].deleteMsg);
            this.getTasking();
            // this.getViewStatus(this.data_list.id);
          } else {
            this.notification.displayMessage(language[environment.DEFAULT_LANG].unableDelete);
          }
        });
      }
      dialogRef=null;
    });
  }






}
